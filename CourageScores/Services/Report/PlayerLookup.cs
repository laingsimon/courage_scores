using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Services.Report;

public class PlayerLookup : IPlayerLookup, IGameVisitor
{
    private readonly Dictionary<Guid, PlayerDetails> _playerLookup = new();

    public void VisitGame(Game game)
    {
        AddPlayers(game.Home, game.Matches.SelectMany(m => m.HomePlayers));
        AddPlayers(game.Away, game.Matches.SelectMany(m => m.AwayPlayers));
    }

    private void AddPlayers(GameTeam team, IEnumerable<GamePlayer> players)
    {
        foreach (var player in players)
        {
            _playerLookup.TryAdd(
                player.Id,
                new PlayerDetails
                {
                    PlayerName = player.Name,
                    TeamId = team.Id,
                    TeamName = team.Name,
                });
        }
    }

    public Task<PlayerDetails> GetPlayer(Guid playerId)
    {
        return Task.FromResult(_playerLookup.TryGetValue(playerId, out var player)
            ? player
            : new PlayerDetails());
    }
}