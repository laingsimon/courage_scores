using CourageScores.Models.Cosmos.Game;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Services.Game;

public class GameComparer : IEqualityComparer<CosmosGame>
{
    private readonly IEqualityComparer<GameTeam> _teamComparer;
    private readonly IEqualityComparer<GameMatch> _matchComparer;
    private readonly IEqualityComparer<GameMatchOption?> _matchOptionComparer;
    private readonly IEqualityComparer<ICollection<GamePlayer>> _oneEightiesComparer;
    private readonly IEqualityComparer<ICollection<NotablePlayer>> _hiChecksComparer;

    public GameComparer(
        IEqualityComparer<GameTeam> teamComparer,
        IEqualityComparer<GameMatch> matchComparer,
        IEqualityComparer<GameMatchOption?> matchOptionComparer,
        IEqualityComparer<ICollection<GamePlayer>> oneEightiesComparer,
        IEqualityComparer<ICollection<NotablePlayer>> hiChecksComparer)
    {
        _teamComparer = teamComparer;
        _matchComparer = matchComparer;
        _matchOptionComparer = matchOptionComparer;
        _oneEightiesComparer = oneEightiesComparer;
        _hiChecksComparer = hiChecksComparer;
    }

    public bool Equals(CosmosGame? x, CosmosGame? y)
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
               && x.Date == y.Date
               && x.DivisionId == y.DivisionId
               && x.SeasonId == y.SeasonId
               && _teamComparer.Equals(x.Home, y.Home)
               && _teamComparer.Equals(x.Away, y.Away)
               && x.Matches.SequenceEqual(y.Matches, _matchComparer)
               && x.MatchOptions.SequenceEqual(y.MatchOptions, _matchOptionComparer)
               && _oneEightiesComparer.Equals(x.OneEighties, y.OneEighties)
               && _hiChecksComparer.Equals(x.Over100Checkouts, y.Over100Checkouts);
    }

    public int GetHashCode(CosmosGame obj)
    {
        return obj.Id.GetHashCode()
               ^ obj.Date.GetHashCode()
               ^ obj.DivisionId.GetHashCode()
               ^ obj.SeasonId.GetHashCode()
               ^ _teamComparer.GetHashCode(obj.Home)
               ^ _teamComparer.GetHashCode(obj.Away);
    }
}