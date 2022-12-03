using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Command;

public class UpdateScoresCommand : IUpdateCommand<Game, GameDto>
{
    private readonly IUserService _userService;
    private readonly IAdapter<Game, GameDto> _gameAdapter;
    private readonly ISystemClock _systemClock;
    private RecordScoresDto? _scores;

    public UpdateScoresCommand(IUserService userService, IAdapter<Game, GameDto> gameAdapter, ISystemClock systemClock)
    {
        _userService = userService;
        _gameAdapter = gameAdapter;
        _systemClock = systemClock;
    }

    public UpdateScoresCommand WithData(RecordScoresDto scores)
    {
        _scores = scores;
        return this;
    }

    public async Task<CommandOutcome<GameDto>> ApplyUpdate(Game game, CancellationToken token)
    {
        if (_scores == null)
        {
            throw new InvalidOperationException($"Game hasn't been set, ensure {nameof(WithData)} is called");
        }

        if (game.Deleted != null)
        {
            return new CommandOutcome<GameDto>(false, "Cannot edit a game that has been deleted", null);
        }

        var user = await _userService.GetUser();
        if (user == null)
        {
            return new CommandOutcome<GameDto>(false, $"Game cannot be updated, not logged in", null);
        }

        if (user.Access?.ManageScores != true)
        {
            return new CommandOutcome<GameDto>(false, $"Game cannot be updated, not permitted", null);
        }

        for (var index = 0; index < Math.Max(_scores.Matches.Count, game.Matches.Count); index++)
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

        if (user.Access?.ManageGames == true)
        {
            game.Address = _scores.Address ?? game.Address;
            game.Postponed = _scores.Postponed ?? game.Postponed;
        }

        return new CommandOutcome<GameDto>(true, "Scores updated", await _gameAdapter.Adapt(game));
    }

    private GameMatch AdaptToMatch(RecordScoresDto.RecordScoresMatchDto updatedMatch, UserDto user)
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

    private GameMatch UpdateMatch(GameMatch currentMatch, RecordScoresDto.RecordScoresMatchDto updatedMatch, UserDto user)
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

    private GamePlayer AdaptToPlayer(RecordScoresDto.RecordScoresPlayerDto player, UserDto user)
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

    private NotablePlayer AdaptToHiCheckPlayer(RecordScoresDto.Over100CheckoutDto player, UserDto user)
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