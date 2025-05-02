using CourageScores.Models;
using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Services.Game;

public class GamePlayerComparer : BaseOrderUnimportantComparer<GamePlayer>
{
    public override bool Equals(GamePlayer x, GamePlayer y)
    {
        return x.Id == y.Id
            && StringComparer.OrdinalIgnoreCase.Equals(x.Name.TrimOrDefault(), y.Name.TrimOrDefault());
    }

    public override int GetHashCode(GamePlayer obj)
    {
        return obj.Id.GetHashCode();
    }
}