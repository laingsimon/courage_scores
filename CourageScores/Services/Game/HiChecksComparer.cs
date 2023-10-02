using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Services.Game;

public class HiChecksComparer : BaseOrderUnimportantComparer<NotablePlayer>
{
    public override bool Equals(NotablePlayer x, NotablePlayer y)
    {
        return x.Id == y.Id
               && StringComparer.OrdinalIgnoreCase.Equals(x.Name.Trim(), y.Name.Trim())
               && x.Notes?.Trim() == y.Notes?.Trim();
    }

    public override int GetHashCode(NotablePlayer obj)
    {
        return obj.Id.GetHashCode();
    }
}