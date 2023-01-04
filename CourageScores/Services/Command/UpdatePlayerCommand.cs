﻿using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Command;

public class UpdatePlayerCommand : IUpdateCommand<Team, TeamPlayer>
{
    private readonly IUserService _userService;
    private readonly ISeasonService _seasonService;
    private readonly IGenericRepository<Models.Cosmos.Game.Game> _gameRepository;
    private readonly IAuditingHelper _auditingHelper;
    private Guid? _playerId;
    private EditTeamPlayerDto? _player;
    private Guid? _seasonId;

    public UpdatePlayerCommand(IUserService userService, ISeasonService seasonService, IAuditingHelper auditingHelper, IGenericRepository<Models.Cosmos.Game.Game> gameRepository)
    {
        _userService = userService;
        _seasonService = seasonService;
        _auditingHelper = auditingHelper;
        _gameRepository = gameRepository;
    }

    public UpdatePlayerCommand ForPlayer(Guid playerId)
    {
        _playerId = playerId;
        return this;
    }

    public UpdatePlayerCommand WithData(EditTeamPlayerDto player)
    {
        _player = player;
        return this;
    }

    public UpdatePlayerCommand InSeason(Guid seasonId)
    {
        _seasonId = seasonId;
        return this;
    }

    public async Task<CommandOutcome<TeamPlayer>> ApplyUpdate(Team model, CancellationToken token)
    {
        if (_playerId == null)
        {
            throw new InvalidOperationException($"PlayerId hasn't been set, ensure {nameof(ForPlayer)} is called");
        }

        if (_player == null)
        {
            throw new InvalidOperationException($"Player hasn't been set, ensure {nameof(WithData)} is called");
        }

        if (_seasonId == null)
        {
            throw new InvalidOperationException($"SeasonId hasn't been set, ensure {nameof(InSeason)} is called");
        }

        if (model.Deleted != null)
        {
            return new CommandOutcome<TeamPlayer>(false, "Cannot edit a team that has been deleted", null);
        }

        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return new CommandOutcome<TeamPlayer>(false, "Player cannot be updated, not logged in", null);
        }

        if (!(user.Access?.ManageTeams == true || (user.Access?.InputResults == true && user.TeamId == model.Id)))
        {
            return new CommandOutcome<TeamPlayer>(false, "Player cannot be updated, not permitted", null);
        }

        var season = await _seasonService.Get(_seasonId.Value, token);
        if (season == null)
        {
            return new CommandOutcome<TeamPlayer>(false, "Season could not be found", null);
        }

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == season.Id);
        if (teamSeason == null)
        {
            return new CommandOutcome<TeamPlayer>(false, $"Team {model.Name} is not registered to the {season.Name} season", null);
        }

        var player = teamSeason.Players.SingleOrDefault(p => p.Id == _playerId);
        if (player == null)
        {
            return new CommandOutcome<TeamPlayer>(false, $"Team does not have a player with this id for the {season.Name} season", null);
        }

        var updatedGames = await UpdateGames(token).CountAsync();

        player.Name = _player.Name;
        player.Captain = _player.Captain;
        player.EmailAddress = _player.EmailAddress ?? player.EmailAddress;
        await _auditingHelper.SetUpdated(player, token);
        return new CommandOutcome<TeamPlayer>(true, $"Player {player.Name} updated in the {season.Name} season, {updatedGames} game/s updated", player);
    }

    private async IAsyncEnumerable<Models.Cosmos.Game.Game> UpdateGames([EnumeratorCancellation] CancellationToken token)
    {
        var games = _player!.GameId.HasValue
            ? _gameRepository.GetSome($"t.id = '{_player!.GameId!.Value}' and t.seasonId = '{_seasonId}'", token)
            : _gameRepository.GetSome($"t.seasonId = '{_seasonId}'", token);

        await foreach (var game in games.WithCancellation(token))
        {
            if (await UpdatePlayerDetailsInGame(game, token))
            {
                yield return game;
            }
        }
    }

    private async Task<bool> UpdatePlayerDetailsInGame(Models.Cosmos.Game.Game game, CancellationToken token)
    {
        var updated = false;

        foreach (var match in game.Matches)
        {
            foreach (var p in match.AwayPlayers.Where(p => p.Id == _playerId))
            {
                p.Name = _player!.Name;
                updated = true;
            }

            foreach (var p in match.HomePlayers.Where(p => p.Id == _playerId))
            {
                p.Name = _player!.Name;
                updated = true;
            }
        }

        if (updated)
        {
            await _gameRepository.Upsert(game, token);
        }

        return updated;
    }
}