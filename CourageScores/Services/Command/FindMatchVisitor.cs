using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Services.Command;

public class FindMatchVisitor : IGameVisitor
{
    private readonly Guid _matchId;

    public FindMatchVisitor(Guid matchId)
    {
        _matchId = matchId;
    }

    public TournamentMatch? Match { get; private set; }

    public void VisitMatch(IVisitorScope scope, TournamentMatch match)
    {
        if (match.Id == _matchId)
        {
            Match = match;
        }
    }

    public static TournamentMatch? FindMatch(TournamentGame model, Guid matchId)
    {
        var visitor = new FindMatchVisitor(matchId);
        model.Accept(new VisitorScope(), visitor);
        return visitor.Match;
    }
}