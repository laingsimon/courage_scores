using CourageScores.Filters;
using CourageScores.Models.Dtos;
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

    public AddOrUpdateSeasonCommand(ISeasonService seasonService, ITeamService teamService, ICommandFactory commandFactory, ScopedCacheManagementFlags cacheFlags)
    {
        _seasonService = seasonService;
        _teamService = teamService;
        _commandFactory = commandFactory;
        _cacheFlags = cacheFlags;
    }

    protected override async Task<CommandResult> ApplyUpdates(Models.Cosmos.Season season, EditSeasonDto update, CancellationToken token)
    {
        season.Name = update.Name;
        season.EndDate = update.EndDate;
        season.StartDate = update.StartDate;

        if (update.CopyTeamsFromSeasonId.HasValue && update.Id == default)
        {
            // assign the season to each of the teams in the given season
            return await AssignTeamsToNewSeason(season.Id, update.CopyTeamsFromSeasonId.Value, token);
        }

        _cacheFlags.EvictDivisionDataCacheForSeasonId = season.Id;
        return CommandResult.SuccessNoMessage;
    }

    private async Task<CommandResult> AssignTeamsToNewSeason(Guid seasonId, Guid copyFromSeasonId, CancellationToken token)
    {
        var otherSeason = await _seasonService.Get(copyFromSeasonId, token);
        if (otherSeason == null)
        {
            return new CommandResult
            {
                Success = false,
                Message = "Could not find season to copy teams from",
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

        return new CommandResult
        {
            Success = true,
            Message = $"Copied {teamsCopied} of {totalTeams} team/s from other season",
        };
    }
}