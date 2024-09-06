using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Tests.Models.Cosmos.Game;

public class TournamentMatchBuilder
{
    private readonly TournamentMatch _match;

    public TournamentMatchBuilder()
    {
        _match = new TournamentMatch();
    }

    public TournamentMatchBuilder WithSides(TournamentSide sideA, TournamentSide sideB)
    {
        _match.SideA = sideA;
        _match.SideB = sideB;
        return this;
    }

    public TournamentMatchBuilder WithScores(int sideA, int sideB)
    {
        _match.ScoreA = sideA;
        _match.ScoreB = sideB;
        return this;
    }

    public TournamentMatchBuilder WithSaygId(Guid id)
    {
        _match.SaygId = id;
        return this;
    }

    public TournamentMatch Build()
    {
        return _match;
    }
}