using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Tests.Models.Cosmos.Game;

public class TournamentGameBuilder
{
    private readonly TournamentGame _tournament;

    public TournamentGameBuilder(TournamentGame? tournament = null)
    {
        _tournament = tournament ?? new TournamentGame { Id = Guid.NewGuid() };
    }

    public TournamentGame Build()
    {
        return _tournament;
    }

    public TournamentGameBuilder WithDate(DateTime date)
    {
        _tournament.Date = date;
        return this;
    }

    public TournamentGameBuilder WithSeason(SeasonDto season)
    {
        _tournament.SeasonId = season.Id;
        return this;
    }

    public TournamentGameBuilder WithType(string type)
    {
        _tournament.Type = type;
        return this;
    }

    public TournamentGameBuilder AccoladesCount(bool count = true)
    {
        _tournament.AccoladesCount = count;
        return this;
    }

    public TournamentGameBuilder WithOneEighties(params TournamentPlayer[] players)
    {
        _tournament.OneEighties.AddRange(players);
        return this;
    }

    public TournamentGameBuilder WithDivision(DivisionDto division)
    {
        _tournament.DivisionId = division.Id;
        return this;
    }

    public TournamentGameBuilder WithAddress(string address)
    {
        _tournament.Address = address;
        return this;
    }

    public TournamentGameBuilder WithNotes(string notes)
    {
        _tournament.Notes = notes;
        return this;
    }

    public TournamentGameBuilder WithSides(params TournamentSide[] sides)
    {
        _tournament.Sides.AddRange(sides);
        return this;
    }

    public TournamentGameBuilder WithRound(TournamentRound round)
    {
        _tournament.Round = round;
        return this;
    }

    public TournamentGameBuilder WithRound(Func<TournamentRoundBuilder, TournamentRoundBuilder> builder)
    {
        return WithRound(builder(new TournamentRoundBuilder()).Build());
    }

    public TournamentGameBuilder SingleRound(bool singleRound = true)
    {
        _tournament.SingleRound = singleRound;
        return this;
    }
}