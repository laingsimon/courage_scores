using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Services.Game;

public class GameMatchComparer : IEqualityComparer<GameMatch>
{
    private readonly IEqualityComparer<ICollection<GamePlayer>> _playerComparer;

    public GameMatchComparer(IEqualityComparer<ICollection<GamePlayer>> playerComparer)
    {
        _playerComparer = playerComparer;
    }

    public bool Equals(GameMatch? x, GameMatch? y)
    {
        if (x == null && y == null)
        {
            return true;
        }

        if (x == null || y == null)
        {
            return false;
        }

        return x.HomeScore == y.HomeScore
               && x.AwayScore == y.AwayScore
               && _playerComparer.Equals(x.HomePlayers, y.HomePlayers)
               && _playerComparer.Equals(x.AwayPlayers, y.AwayPlayers);
    }

    public int GetHashCode(GameMatch obj)
    {
        return (obj.HomeScore?.GetHashCode() ^ obj.AwayScore?.GetHashCode()) ?? 0;
    }
}