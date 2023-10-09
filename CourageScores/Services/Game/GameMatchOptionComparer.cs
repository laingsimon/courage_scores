using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Services.Game;

public class GameMatchOptionComparer : IEqualityComparer<GameMatchOption?>
{
    public bool Equals(GameMatchOption? x, GameMatchOption? y)
    {
        if (x == null && y == null)
        {
            return true;
        }

        if (x == null || y == null)
        {
            return false;
        }

        return x.StartingScore == y.StartingScore
               && x.NumberOfLegs == y.NumberOfLegs
               && x.PlayerCount == y.PlayerCount;
    }

    public int GetHashCode(GameMatchOption? obj)
    {
        if (obj == null)
        {
            return 0;
        }

        return (obj.NumberOfLegs ^ obj.StartingScore ^ obj.PlayerCount) ?? 0;
    }
}