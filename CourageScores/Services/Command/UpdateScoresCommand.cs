using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Command;

public class UpdateScoresCommand : IUpdateCommand<Models.Cosmos.Game.Game, GameDto>
{
    private readonly IUserService _userService;
    private readonly IAdapter<Models.Cosmos.Game.Game, GameDto> _gameAdapter;
    private readonly ISystemClock _systemClock;
    private readonly ISeasonService _seasonService;
    private readonly ICommandFactory _commandFactory;
    private readonly ITeamService _teamService;
    private RecordScoresDto? _scores;

    public UpdateScoresCommand(
        IUserService userService,
        IAdapter<Models.Cosmos.Game.Game, GameDto> gameAdapter,
        ISystemClock systemClock,
        ISeasonService seasonService,
        ICommandFactory commandFactory,
        ITeamService teamService)
    {
        _userService = userService;
        _gameAdapter = gameAdapter;
        _systemClock = systemClock;
        _seasonService = seasonService;
        _commandFactory = commandFactory;
        _teamService = teamService;
    }

    public UpdateScoresCommand WithData(RecordScoresDto scores)
    {
        _scores = scores;
        return this;
    }

    public async Task<CommandOutcome<GameDto>> ApplyUpdate(Models.Cosmos.Game.Game game, CancellationToken token)
    {
        if (_scores == null)
        {
            throw new InvalidOperationException($"Game hasn't been set, ensure {nameof(WithData)} is called");
        }

        if (game.Deleted != null)
        {
            return new CommandOutcome<GameDto>(false, "Cannot edit a game that has been deleted", null);
        }

        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return new CommandOutcome<GameDto>(false, $"Game cannot be updated, not logged in", null);
        }

        if (!(user.Access?.ManageScores == true || (user.Access?.InputResults == true && (user.TeamId == game.Home.Id || user.TeamId == game.Away.Id))))
        {
            return new CommandOutcome<GameDto>(false, "Game cannot be updated, not permitted", null);
        }

        if (user.Access?.ManageScores == true)
        {
            // edit the root game record
            UpdateResults(game, user);
        } else if (user.Access?.InputResults == true)
        {
            var gameSubmission = user.TeamId == game.Home.Id
                ? game.HomeSubmission ??= new Models.Cosmos.Game.Game()
                : game.AwaySubmission ??= new Models.Cosmos.Game.Game();

            UpdateResults(MergeDetails(game, gameSubmission), user);

            // TODO: #116: If both home/away submissions are the same then record the details in the main game
        }

        if (user.Access?.ManageGames == true)
        {
            game.Address = _scores.Address ?? game.Address;
            game.Postponed = _scores.Postponed ?? game.Postponed;

            var dateChanged = _scores.Date != game.Date;
            game.Date = _scores.Date ?? game.Date;

            if (dateChanged)
            {
                var newSeasonId = await GetAppropriateSeasonId(game.Date, token);
                if (newSeasonId != null && (newSeasonId != game.SeasonId || dateChanged))
                {
                    var command = _commandFactory.GetCommand<AddSeasonToTeamCommand>();
                    command.ForSeason(newSeasonId.Value);
                    command.CopyPlayersFromSeasonId(game.SeasonId);

                    game.SeasonId = newSeasonId.Value;

                    // register both teams with this season.
                    var homeResult = await AddSeasonToTeam(game.Home.Id, command, token);
                    var awayResult = await AddSeasonToTeam(game.Away.Id, command, token);

                    var success = homeResult.Success && awayResult.Success;
                    if (!success)
                    {
                        return new CommandOutcome<GameDto>(
                            false,
                            $"Could not add season to home and/or away teams: Home: {FormatActionResult(homeResult)}, Away: {FormatActionResult(awayResult)}",
                            await _gameAdapter.Adapt(game, token));
                    }
                }
            }
        }

        return new CommandOutcome<GameDto>(true, "Scores updated", await _gameAdapter.Adapt(game, token));
    }

    private Models.Cosmos.Game.Game MergeDetails(Models.Cosmos.Game.Game game, Models.Cosmos.Game.Game submission)
    {
        submission.Id = game.Id;
        submission.Away = game.Away;
        submission.Home = game.Home;
        submission.Address = game.Address;
        submission.Date = game.Date;
        submission.Postponed = game.Postponed;
        submission.DivisionId = game.DivisionId;
        submission.IsKnockout = game.IsKnockout;
        submission.SeasonId = game.SeasonId;
        return submission;
    }

    private void UpdateResults(Models.Cosmos.Game.Game game, UserDto user)
    {
#pragma warning disable CS8602
        for (var index = 0; index < Math.Max(_scores.Matches.Count, game.Matches.Count); index++)
#pragma warning restore CS8602
        {
            var updatedMatch = _scores.Matches.ElementAtOrDefault(index);
            var currentMatch = game.Matches.ElementAtOrDefault(index);

            if (currentMatch == null && updatedMatch != null)
            {
                game.Matches.Add(AdaptToMatch(updatedMatch, user));
            }
            else if (updatedMatch == null && currentMatch != null)
            {
                game.Matches.RemoveAt(index);
            }
            else if (currentMatch != null && updatedMatch != null)
            {
                game.Matches[index] = UpdateMatch(currentMatch, updatedMatch, user);
            }

            game.Home.ManOfTheMatch = _scores.Home?.ManOfTheMatch;
            game.Away.ManOfTheMatch = _scores.Away?.ManOfTheMatch;
        }
    }

    private static string FormatActionResult(ActionResultDto<TeamDto> actionResultDto)
    {
        return $"Success: {actionResultDto.Success}, Errors: {string.Join(", ", actionResultDto.Errors)}, Warnings: {string.Join(", ", actionResultDto.Warnings)}, Messages: {string.Join(", ", actionResultDto.Messages)}";
    }

    private async Task<ActionResultDto<TeamDto>> AddSeasonToTeam(Guid teamId, AddSeasonToTeamCommand command, CancellationToken token)
    {
        return await _teamService.Upsert(teamId, command, token);
    }

    private async Task<Guid?> GetAppropriateSeasonId(DateTime gameDate, CancellationToken token)
    {
        var seasons = await _seasonService.GetAll(token)
            .WhereAsync(s => s.StartDate <= gameDate && s.EndDate >= gameDate)
            .ToList();

        switch (seasons.Count)
        {
            case 0:
                // no seasons found for this date
                return null;
            case 1:
                // only one season found, return its id
                return seasons.Single().Id;
            default:
                // multiple seasons found, cannot unambiguously determine which one to use
                return null;
        }
    }

    private GameMatch AdaptToMatch(RecordScoresDto.RecordScoresGameMatchDto updatedMatch, UserDto user)
    {
        return new GameMatch
        {
            Author = user.Name,
            Created = _systemClock.UtcNow.UtcDateTime,
            Deleted = null,
            Editor = user.Name,
            Id = Guid.NewGuid(),
            Remover = null,
            Updated = _systemClock.UtcNow.UtcDateTime,
            AwayPlayers = updatedMatch.AwayPlayers.Select(p => AdaptToPlayer(p, user)).ToList(),
            AwayScore = updatedMatch.AwayScore,
            HomePlayers = updatedMatch.HomePlayers.Select(p => AdaptToPlayer(p, user)).ToList(),
            HomeScore = updatedMatch.HomeScore,
            OneEighties = updatedMatch.OneEighties.Select(p => AdaptToPlayer(p, user)).ToList(),
            Over100Checkouts = updatedMatch.Over100Checkouts.Select(p => AdaptToHiCheckPlayer(p, user)).ToList(),
            StartingScore = GetStartingScore(updatedMatch.HomePlayers.Count),
            NumberOfLegs = GetNumberOfLegs(updatedMatch.HomePlayers.Count),
        };
    }

    private GameMatch UpdateMatch(GameMatch currentMatch, RecordScoresDto.RecordScoresGameMatchDto updatedMatch, UserDto user)
    {
        return new GameMatch
        {
            Author = currentMatch.Author,
            Created = currentMatch.Created,
            Deleted = currentMatch.Deleted,
            Editor = user.Name,
            Id = currentMatch.Id,
            Remover = currentMatch.Remover,
            Updated = _systemClock.UtcNow.UtcDateTime,
            Version = currentMatch.Version,
            AwayPlayers = updatedMatch.AwayPlayers.Select(p => AdaptToPlayer(p, user)).ToList(),
            AwayScore = updatedMatch.AwayScore,
            HomePlayers = updatedMatch.HomePlayers.Select(p => AdaptToPlayer(p, user)).ToList(),
            HomeScore = updatedMatch.HomeScore,
            OneEighties = updatedMatch.OneEighties.Select(p => AdaptToPlayer(p, user)).ToList(),
            Over100Checkouts = updatedMatch.Over100Checkouts.Select(p => AdaptToHiCheckPlayer(p, user)).ToList(),
            StartingScore = GetStartingScore(updatedMatch.HomePlayers.Count),
            NumberOfLegs = GetNumberOfLegs(updatedMatch.HomePlayers.Count),
        };
    }

    private GamePlayer AdaptToPlayer(RecordScoresDto.RecordScoresGamePlayerDto player, UserDto user)
    {
        return new GamePlayer
        {
            Id = player.Id,
            Name = player.Name,
            Author = user.Name,
            Created = _systemClock.UtcNow.UtcDateTime,
            Editor = user.Name,
            Updated = _systemClock.UtcNow.UtcDateTime,
        };
    }

    private NotablePlayer AdaptToHiCheckPlayer(RecordScoresDto.GameOver100CheckoutDto player, UserDto user)
    {
        return new NotablePlayer
        {
            Id = player.Id,
            Name = player.Name,
            Author = user.Name,
            Created = _systemClock.UtcNow.UtcDateTime,
            Editor = user.Name,
            Updated = _systemClock.UtcNow.UtcDateTime,
            Notes = player.Notes,
        };
    }

    private static int? GetNumberOfLegs(int homePlayers)
    {
        switch (homePlayers)
        {
            case 3: return 3;
            case 2: return 3;
            case 1: return 5;
            default: return null;
        }
    }

    private static int? GetStartingScore(int homePlayers)
    {
        switch (homePlayers)
        {
            case 3: return 601;
            default: return 501;
        }
    }
}