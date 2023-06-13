using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Season;
using CourageScores.Services.Team;

namespace CourageScores.Services.Command;

public class AddOrUpdateGameCommand : AddOrUpdateCommand<Models.Cosmos.Game.Game, EditGameDto>
{
    private readonly ISeasonService _seasonService;
    private readonly ICommandFactory _commandFactory;
    private readonly ITeamService _teamService;
    private readonly ScopedCacheManagementFlags _cacheFlags;

    public AddOrUpdateGameCommand(
        ISeasonService seasonService,
        ICommandFactory commandFactory,
        ITeamService teamService,
        ScopedCacheManagementFlags cacheFlags)
    {
        _seasonService = seasonService;
        _commandFactory = commandFactory;
        _teamService = teamService;
        _cacheFlags = cacheFlags;
    }

    protected override async Task<ActionResult<Models.Cosmos.Game.Game>> ApplyUpdates(Models.Cosmos.Game.Game game, EditGameDto update, CancellationToken token)
    {
        if (update.SeasonId == Guid.Empty)
        {
            return new ActionResult<Models.Cosmos.Game.Game>
            {
                Success = false,
                Messages = { "SeasonId must be provided" },
            };
        }

        if (update.HomeTeamId == update.AwayTeamId)
        {
            return new ActionResult<Models.Cosmos.Game.Game>
            {
                Success = false,
                Messages = { "Unable to update a game where the home team and away team are the same" },
            };
        }

        var season = await _seasonService.Get(update.SeasonId, token);
        if (season == null)
        {
            return new ActionResult<Models.Cosmos.Game.Game>
            {
                Success = false,
                Messages = { "Unable to add or update game, season not found" },
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
            game.Home = await UpdateTeam(update.HomeTeamId, season, token);
        }

        // ReSharper disable once ConditionIsAlwaysTrueOrFalseAccordingToNullableAPIContract
        if (game.Away == null || game.Away.Id != update.AwayTeamId)
        {
            game.Away = await UpdateTeam(update.AwayTeamId, season, token);
        }

        return new ActionResult<Models.Cosmos.Game.Game>
        {
            Success = true,
        };
    }

    private async Task<GameTeam> UpdateTeam(Guid teamId, SeasonDto season, CancellationToken token)
    {
        var teamDto = await _teamService.Get(teamId, token);

        if (teamDto == null)
        {
            throw new InvalidOperationException("Unable to find team with id " + teamId);
        }

        if (teamDto.Seasons.All(s => s.SeasonId != season.Id))
        {
            // add team to season
            var command = _commandFactory.GetCommand<AddSeasonToTeamCommand>().ForSeason(season.Id);
            var result = await _teamService.Upsert(teamId, command, token);

            if (!result.Success)
            {
                throw new InvalidOperationException("Could not add season to team: " + string.Join(", ", result.Errors));
            }
        }

        return Adapt(teamDto);
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
            ManOfTheMatch = null // changing the team resets the man of the match
        };
    }
}