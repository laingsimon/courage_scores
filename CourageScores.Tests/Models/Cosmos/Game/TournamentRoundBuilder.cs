using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Tests.Models.Cosmos.Game;

public class TournamentRoundBuilder
{
    private readonly TournamentRound _round;

    public TournamentRoundBuilder()
    {
        _round = new TournamentRound();
    }

    public TournamentRoundBuilder WithRound(TournamentRound round)
    {
        _round.NextRound = round;
        return this;
    }

    public TournamentRoundBuilder WithRound(Func<TournamentRoundBuilder, TournamentRoundBuilder> builder)
    {
        return WithRound(builder(new TournamentRoundBuilder()).Build());
    }

    public TournamentRoundBuilder WithSide(params TournamentSide[] sides)
    {
        _round.Sides.AddRange(sides);
        return this;
    }

    public TournamentRoundBuilder WithMatch(Func<TournamentMatchBuilder, TournamentMatchBuilder> builder)
    {
        return WithMatch(builder(new TournamentMatchBuilder()).Build());
    }

    public TournamentRoundBuilder WithMatch(params TournamentMatch[] matches)
    {
        _round.Matches.AddRange(matches);
        return this;
    }

    public TournamentRoundBuilder WithMatchOption(params GameMatchOption[] matchOptions)
    {
        _round.MatchOptions.AddRange(matchOptions);
        return this;
    }

    public TournamentRound Build()
    {
        return _round;
    }
}