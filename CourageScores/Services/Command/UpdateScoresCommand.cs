using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Season;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using CourageScores.Services.Team;

namespace CourageScores.Services.Command;

public class UpdateScoresCommand : IUpdateCommand<Models.Cosmos.Game.Game, GameDto>
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private readonly IUpdateScoresAdapter _updateScoresAdapter;
    private readonly ICommandFactory _commandFactory;
    private readonly IAdapter<Models.Cosmos.Game.Game, GameDto> _gameAdapter;
    private readonly ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?> _matchOptionsAdapter;
    private readonly ICachingSeasonService _seasonService;
    private readonly ITeamService _teamService;
    private readonly IUserService _userService;
    private RecordScoresDto? _scores;

    public UpdateScoresCommand(IUserService userService,
        IAdapter<Models.Cosmos.Game.Game, GameDto> gameAdapter,
        ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?> matchOptionsAdapter,
        IAuditingHelper auditingHelper,
        ICachingSeasonService seasonService,
        ICommandFactory commandFactory,
        ITeamService teamService,
        ScopedCacheManagementFlags cacheFlags,
        IUpdateScoresAdapter updateScoresAdapter)
    {
        _userService = userService;
        _gameAdapter = gameAdapter;
        _matchOptionsAdapter = matchOptionsAdapter;
        _auditingHelper = auditingHelper;
        _seasonService = seasonService;
        _commandFactory = commandFactory;
        _teamService = teamService;
        _cacheFlags = cacheFlags;
        _updateScoresAdapter = updateScoresAdapter;
    }

    public UpdateScoresCommand WithData(RecordScoresDto scores)
    {
        _scores = scores;
        return this;
    }

    public async Task<ActionResult<GameDto>> ApplyUpdate(Models.Cosmos.Game.Game game, CancellationToken token)
    {
        if (_scores == null)
        {
            throw new InvalidOperationException($"Game hasn't been set, ensure {nameof(WithData)} is called");
        }

        if (game.Deleted != null)
        {
            return Error("Cannot edit a game that has been deleted");
        }

        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return Error("Game cannot be updated, not logged in");
        }

        var access = user.Access ?? new AccessDto();
        if (!(access.ManageScores || access.InputResults && (user.TeamId == game.Home.Id || user.TeamId == game.Away.Id)))
        {
            return Error("Game cannot be updated, not permitted");
        }

        if (access.ManageScores)
        {
            // edit the root game record
            var result = await UpdateResults(game, token);
            if (!result.Success)
            {
                return result;
            }

            _cacheFlags.EvictDivisionDataCacheForDivisionId = game.DivisionId;
            _cacheFlags.EvictDivisionDataCacheForSeasonId = game.SeasonId;
        }
        else if (access.InputResults)
        {
            var result = await UpdateSubmission(game, user, token);
            if (!result.Success)
            {
                return result;
            }
        }

        if (access.ManageGames)
        {
            var result = await UpdateGameDetails(game, token);
            if (!result.Success)
            {
                return result;
            }

            _cacheFlags.EvictDivisionDataCacheForDivisionId = game.DivisionId;
            _cacheFlags.EvictDivisionDataCacheForSeasonId = game.SeasonId;
        }

        return Success("Scores updated", await _gameAdapter.Adapt(game, token));
    }

    private async Task<ActionResult<GameDto>> UpdateGameDetails(Models.Cosmos.Game.Game game, CancellationToken token)
    {
        // ReSharper disable once NullCoalescingConditionIsAlwaysNotNullAccordingToAPIContract
        game.Address = _scores!.Address ?? game.Address;
        game.Postponed = _scores.Postponed;
        game.IsKnockout = _scores.IsKnockout;
        game.AccoladesCount = _scores.AccoladesCount;
        game.MatchOptions = await _scores.MatchOptions.SelectAsync(mo => _matchOptionsAdapter.Adapt(mo, token)).ToList();

        var dateChanged = _scores.Date != game.Date;
        game.Date = _scores.Date;

        var dateChangedResult = dateChanged
            ? await MoveGameToAlternativeSeason(game, token)
            : null;

        return dateChangedResult ?? Success("Game details updated");
    }

    private async Task<ActionResult<GameDto>?> MoveGameToAlternativeSeason(Models.Cosmos.Game.Game game, CancellationToken token)
    {
        var newSeasonId = await GetAppropriateSeasonId(game.Date, token);
        if (newSeasonId == null)
        {
            return Warning($"Unable to find season for date: {game.Date:dd MMM yyyy}");
        }
        if (newSeasonId == game.SeasonId)
        {
            return null;
        }

        var command = _commandFactory.GetCommand<AddSeasonToTeamCommand>()
            .ForSeason(newSeasonId.Value)
            .ForDivision(game.DivisionId)
            .CopyPlayersFromSeasonId(game.SeasonId);

        game.SeasonId = newSeasonId.Value;

        // register both teams with this season.
        var homeResult = await _teamService.Upsert(game.Home.Id, command, token);
        var awayResult = await _teamService.Upsert(game.Away.Id, command, token);

        var success = homeResult.Success && awayResult.Success;
        if (success)
        {
            return null;
        }

        return new ActionResult<GameDto>
        {
            Success = false,
            Errors = homeResult.Errors.Concat(awayResult.Errors).ToList(),
            Warnings = homeResult.Warnings.Concat(awayResult.Warnings).ToList(),
            Messages = homeResult.Messages.Concat(awayResult.Messages)
                .Concat(new[]
                {
                    "Could not add season to home and/or away teams",
                }).ToList(),
            Result = await _gameAdapter.Adapt(game, token),
        };
    }

    private async Task<ActionResult<GameDto>> UpdateSubmission(Models.Cosmos.Game.Game game, UserDto user, CancellationToken token)
    {
        if (game.Matches.Any())
        {
            return Error("Submissions cannot be accepted, scores have been published");
        }

        if (user.TeamId == game.Home.Id)
        {
            var result = await UpdateResults(MergeDetails(game, game.HomeSubmission ??= NewSubmission(game)), token);
            if (!result.Success)
            {
                return result;
            }

            await _auditingHelper.SetUpdated(game.HomeSubmission, token);
        }
        else if (user.TeamId == game.Away.Id)
        {
            var result = await UpdateResults(MergeDetails(game, game.AwaySubmission ??= NewSubmission(game)), token);
            if (!result.Success)
            {
                return result;
            }

            await _auditingHelper.SetUpdated(game.AwaySubmission, token);
        }

        // TODO: #123: If both home/away submissions are the same then record the details in the main game

        return Success("Submission updated");
    }

    private async Task<ActionResult<GameDto>> UpdateResults(Models.Cosmos.Game.Game game, CancellationToken token)
    {
        if (game.Updated != _scores!.LastUpdated)
        {
            return Warning(_scores.LastUpdated == null
                ? $"Unable to update {nameof(Game)}, data integrity token is missing"
                : $"Unable to update {nameof(Game)}, {game.Editor} updated it before you at {game.Updated:d MMM yyyy HH:mm:ss}");
        }

        for (var index = 0; index < Math.Max(_scores.Matches.Count, game.Matches.Count); index++)
        {
            var updatedMatch = _scores.Matches.ElementAtOrDefault(index);
            var currentMatch = game.Matches.ElementAtOrDefault(index);

            if (currentMatch == null && updatedMatch != null)
            {
                game.Matches.Add(await _updateScoresAdapter.AdaptToMatch(updatedMatch, token));
            }
            else if (updatedMatch == null && currentMatch != null)
            {
                game.Matches.RemoveAt(index);
            }
            else if (currentMatch != null && updatedMatch != null)
            {
                game.Matches[index] = await _updateScoresAdapter.UpdateMatch(currentMatch, updatedMatch, token);
            }

            game.OneEighties = await _scores.OneEighties.SelectAsync(p => _updateScoresAdapter.AdaptToPlayer(p, token)).ToList();
            game.Over100Checkouts = await _scores.Over100Checkouts.SelectAsync(p => _updateScoresAdapter.AdaptToHiCheckPlayer(p, token)).ToList();
            game.Home.ManOfTheMatch = _scores.Home?.ManOfTheMatch;
            game.Away.ManOfTheMatch = _scores.Away?.ManOfTheMatch;
            game.Version = Models.Cosmos.Game.Game.CurrentVersion;
        }

        return Success("Game updated");
    }

    private async Task<Guid?> GetAppropriateSeasonId(DateTime gameDate, CancellationToken token)
    {
        var season = await _seasonService.GetForDate(gameDate, token);
        return season?.Id;
    }

    private static Models.Cosmos.Game.Game NewSubmission(AuditedEntity game)
    {
        return new Models.Cosmos.Game.Game
        {
            Updated = game.Updated,
            Editor = game.Editor,
        };
    }

    private static Models.Cosmos.Game.Game MergeDetails(Models.Cosmos.Game.Game game, Models.Cosmos.Game.Game submission)
    {
        submission.Id = game.Id;
        submission.Away = game.Away;
        submission.Home = game.Home;
        submission.Address = game.Address;
        submission.Date = game.Date;
        submission.Postponed = game.Postponed;
        submission.DivisionId = game.DivisionId;
        submission.IsKnockout = game.IsKnockout;
        submission.AccoladesCount = game.AccoladesCount;
        submission.SeasonId = game.SeasonId;
        return submission;
    }

    private static ActionResult<GameDto> Success(string message, GameDto? result = null)
    {
        return new ActionResult<GameDto>
        {
            Success = true,
            Messages =
            {
                message,
            },
            Result = result,
        };
    }

    private static ActionResult<GameDto> Warning(string message)
    {
        return new ActionResult<GameDto>
        {
            Success = false,
            Warnings =
            {
                message,
            },
        };
    }

    private static ActionResult<GameDto> Error(string message)
    {
        return new ActionResult<GameDto>
        {
            Success = false,
            Errors =
            {
                message,
            },
        };
    }
}