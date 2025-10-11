using CourageScores.Common;
using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Dtos.Season;
using CourageScores.Repository;
using CourageScores.Services.Season;
using CourageScores.Services.Team;
using CosmosSeason = CourageScores.Models.Cosmos.Season.Season;
using CosmosDivision = CourageScores.Models.Cosmos.Division;

namespace CourageScores.Services.Command;

// ReSharper disable once ClassNeverInstantiated.Global
public class AddOrUpdateSeasonCommand : AddOrUpdateCommand<CosmosSeason, EditSeasonDto>
{
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private readonly ICommandFactory _commandFactory;
    private readonly IGenericRepository<CosmosDivision> _divisionRepository;
    private readonly ICachingSeasonService _seasonService;
    private readonly ITeamService _teamService;

    public AddOrUpdateSeasonCommand(
        ICachingSeasonService seasonService,
        ITeamService teamService,
        ICommandFactory commandFactory,
        ScopedCacheManagementFlags cacheFlags,
        IGenericRepository<CosmosDivision> divisionRepository)
    {
        _seasonService = seasonService;
        _teamService = teamService;
        _commandFactory = commandFactory;
        _cacheFlags = cacheFlags;
        _divisionRepository = divisionRepository;
    }

    protected override async Task<ActionResult<CosmosSeason>> ApplyUpdates(CosmosSeason season, EditSeasonDto update, CancellationToken token)
    {
        season.Name = update.Name.TrimOrDefault();
        season.EndDate = update.EndDate;
        season.StartDate = update.StartDate;
        season.Divisions = await update.DivisionIds
            .SelectAsync(async id => (await _divisionRepository.Get(id, token))!)
            .ToList();
        season.FixtureStartTime = update.FixtureStartTime;
        season.FixtureDuration = update.FixtureDuration;
        season.AllowFavouriteTeams = update.AllowFavouriteTeams;

        if (update.CopyTeamsFromSeasonId.HasValue && update.Id == default)
        {
            // assign the season to each of the teams in the given season
            return await AssignTeamsToNewSeason(season.Id, update.CopyTeamsFromSeasonId.Value, token);
        }

        _cacheFlags.EvictDivisionDataCacheForSeasonId = season.Id;
        return new ActionResult<CosmosSeason>
        {
            Success = true,
            Messages =
            {
                "Season updated",
            },
        };
    }

    private async Task<ActionResult<CosmosSeason>> AssignTeamsToNewSeason(Guid seasonId, Guid copyFromSeasonId, CancellationToken token)
    {
        var otherSeason = await _seasonService.Get(copyFromSeasonId, token);
        if (otherSeason == null)
        {
            return new ActionResult<CosmosSeason>
            {
                Success = false,
                Warnings =
                {
                    "Could not find season to copy teams from",
                },
            };
        }

        var teamsCopied = 0;
        var totalTeams = 0;
        await foreach (var teamToCopy in _teamService.GetTeamsForSeason(copyFromSeasonId, token))
        {
            var currentTeamSeason = teamToCopy.Seasons.Single(ts => ts.SeasonId == copyFromSeasonId);
            var command = _commandFactory.GetCommand<AddSeasonToTeamCommand>()
                .ForSeason(seasonId)
                .ForDivision(currentTeamSeason.DivisionId)
                .CopyPlayersFromSeasonId(copyFromSeasonId)
                .SkipSeasonExistenceCheck();

            totalTeams++;
            var result = await _teamService.Upsert(teamToCopy.Id, command, token);
            if (result.Success)
            {
                teamsCopied++;
            }
        }

        return new ActionResult<CosmosSeason>
        {
            Success = true,
            Messages =
            {
                $"Copied {teamsCopied} of {totalTeams} team/s from other season",
            },
        };
    }
}
