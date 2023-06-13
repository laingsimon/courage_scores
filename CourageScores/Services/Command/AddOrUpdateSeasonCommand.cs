using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Dtos;
using CourageScores.Repository;
using CourageScores.Services.Season;
using CourageScores.Services.Team;

namespace CourageScores.Services.Command;

// ReSharper disable once ClassNeverInstantiated.Global
public class AddOrUpdateSeasonCommand : AddOrUpdateCommand<Models.Cosmos.Season, EditSeasonDto>
{
    private readonly ISeasonService _seasonService;
    private readonly ITeamService _teamService;
    private readonly ICommandFactory _commandFactory;
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private readonly IGenericRepository<Models.Cosmos.Division> _divisionRepository;

    public AddOrUpdateSeasonCommand(
        ISeasonService seasonService,
        ITeamService teamService,
        ICommandFactory commandFactory,
        ScopedCacheManagementFlags cacheFlags,
        IGenericRepository<Models.Cosmos.Division> divisionRepository)
    {
        _seasonService = seasonService;
        _teamService = teamService;
        _commandFactory = commandFactory;
        _cacheFlags = cacheFlags;
        _divisionRepository = divisionRepository;
    }

    protected override async Task<ActionResult<Models.Cosmos.Season>> ApplyUpdates(Models.Cosmos.Season season, EditSeasonDto update, CancellationToken token)
    {
        season.Name = update.Name;
        season.EndDate = update.EndDate;
        season.StartDate = update.StartDate;
        season.Divisions = await update.DivisionIds
            .SelectAsync(async id => (await _divisionRepository.Get(id, token))!)
            .ToList();

        if (update.CopyTeamsFromSeasonId.HasValue && update.Id == default)
        {
            // assign the season to each of the teams in the given season
            return await AssignTeamsToNewSeason(season.Id, update.CopyTeamsFromSeasonId.Value, token);
        }

        _cacheFlags.EvictDivisionDataCacheForSeasonId = season.Id;
        return new ActionResult<Models.Cosmos.Season> { Success = true };
    }

    private async Task<ActionResult<Models.Cosmos.Season>> AssignTeamsToNewSeason(Guid seasonId, Guid copyFromSeasonId, CancellationToken token)
    {
        var otherSeason = await _seasonService.Get(copyFromSeasonId, token);
        if (otherSeason == null)
        {
            return new ActionResult<Models.Cosmos.Season>
            {
                Success = false,
                Warnings = { "Could not find season to copy teams from" },
            };
        }

        var command = _commandFactory.GetCommand<AddSeasonToTeamCommand>()
            .ForSeason(seasonId)
            .CopyPlayersFromSeasonId(copyFromSeasonId)
            .SkipSeasonExistenceCheck();

        var teamsCopied = 0;
        var totalTeams = 0;
        await foreach (var teamToCopy in _teamService.GetTeamsForSeason(copyFromSeasonId, token))
        {
            totalTeams++;
            var result = await _teamService.Upsert(teamToCopy.Id, command, token);
            if (result.Success)
            {
                teamsCopied++;
            }
        }

        return new ActionResult<Models.Cosmos.Season>
        {
            Success = true,
            Messages = { $"Copied {teamsCopied} of {totalTeams} team/s from other season" },
        };
    }
}