using CourageScores.Models;
using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Services.Game;

public class GameTeamComparer : IEqualityComparer<GameTeam>
{
    public bool Equals(GameTeam? x, GameTeam? y)
    {
        if (x == null && y == null)
        {
            return true;
        }

        if (x == null || y == null)
        {
            return false;
        }

        return x.Id == y.Id
            && StringComparer.OrdinalIgnoreCase.Equals(x.Name.TrimOrDefault(), y.Name.TrimOrDefault());
    }

    public int GetHashCode(GameTeam obj)
    {
        return obj.Id.GetHashCode();
    }
}