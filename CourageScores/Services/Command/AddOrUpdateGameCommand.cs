using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Season;
using CourageScores.Services.Team;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Services.Command;

public class AddOrUpdateGameCommand : AddOrUpdateCommand<CosmosGame, EditGameDto>
{
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private readonly ICommandFactory _commandFactory;
    private readonly ICachingSeasonService _seasonService;
    private readonly ITeamService _teamService;

    public AddOrUpdateGameCommand(
        ICachingSeasonService seasonService,
        ICommandFactory commandFactory,
        ITeamService teamService,
        ScopedCacheManagementFlags cacheFlags)
    {
        _seasonService = seasonService;
        _commandFactory = commandFactory;
        _teamService = teamService;
        _cacheFlags = cacheFlags;
    }

    protected override async Task<ActionResult<CosmosGame>> ApplyUpdates(CosmosGame game, EditGameDto update, CancellationToken token)
    {
        if (update.SeasonId == Guid.Empty)
        {
            return new ActionResult<CosmosGame>
            {
                Success = false,
                Errors =
                {
                    "SeasonId must be provided",
                },
            };
        }

        if (update.HomeTeamId == update.AwayTeamId)
        {
            return new ActionResult<CosmosGame>
            {
                Success = false,
                Warnings =
                {
                    "Unable to update a game where the home team and away team are the same",
                },
            };
        }

        var season = await _seasonService.Get(update.SeasonId, token);
        if (season == null)
        {
            return new ActionResult<CosmosGame>
            {
                Success = false,
                Errors =
                {
                    "Unable to add or update game, season not found",
                },
            };
        }

        game.Address = update.Address;
        game.Date = update.Date;
        game.DivisionId = update.DivisionId;
        game.SeasonId = update.SeasonId;
        game.Postponed = update.Postponed;
        game.IsKnockout = update.IsKnockout;
        game.AccoladesCount = update.AccoladesCount;
        _cacheFlags.EvictDivisionDataCacheForSeasonId = game.SeasonId;
        _cacheFlags.EvictDivisionDataCacheForDivisionId = game.DivisionId;

        // ReSharper disable once ConditionIsAlwaysTrueOrFalseAccordingToNullableAPIContract
        if (game.Home == null || game.Home.Id != update.HomeTeamId)
        {
            var homeResult = await UpdateTeam(update.HomeTeamId, season, game.DivisionId, token);
            if (!homeResult.Success)
            {
                return homeResult.As<CosmosGame>();
            }

            game.Home = homeResult.Result!;
        }

        // ReSharper disable once ConditionIsAlwaysTrueOrFalseAccordingToNullableAPIContract
        if (game.Away == null || game.Away.Id != update.AwayTeamId)
        {
            var awayResult = await UpdateTeam(update.AwayTeamId, season, game.DivisionId, token);
            if (!awayResult.Success)
            {
                return awayResult.As<CosmosGame>();
            }

            game.Away = awayResult.Result!;
        }

        return new ActionResult<CosmosGame>
        {
            Success = true,
            Messages =
            {
                "Game updated",
            },
        };
    }

    private async Task<ActionResult<GameTeam>> UpdateTeam(Guid teamId, SeasonDto season, Guid divisionId, CancellationToken token)
    {
        var teamDto = await _teamService.Get(teamId, token);

        if (teamDto == null)
        {
            return new ActionResult<GameTeam>
            {
                Errors = { "Unable to find team with id " + teamId },
                Success = false,
            };
        }

        var result = new ActionResult<GameTeam>
        {
            Success = true,
            Result = Adapt(teamDto),
        };

        if (teamDto.Seasons.Any(s => s.SeasonId == season.Id && s.Deleted == null))
        {
            return result;
        }

        // add team to season
        var command = _commandFactory.GetCommand<AddSeasonToTeamCommand>()
            .ForSeason(season.Id)
            .ForDivision(divisionId);

        var addSeasonToTeamResult = await _teamService.Upsert(teamId, command, token);
        return result.Merge(addSeasonToTeamResult.ToActionResult().As<GameTeam>());
    }

    private static GameTeam Adapt(TeamDto teamDto)
    {
        return new GameTeam
        {
            Author = teamDto.Author!,
            Created = teamDto.Created!.Value,
            Deleted = teamDto.Deleted,
            Editor = teamDto.Editor!,
            Id = teamDto.Id,
            Name = teamDto.Name,
            Remover = teamDto.Remover,
            Updated = teamDto.Updated!.Value,
            ManOfTheMatch = null, // changing the team resets the man of the match
        };
    }
}