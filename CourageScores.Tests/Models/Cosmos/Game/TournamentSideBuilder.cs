using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Tests.Models.Cosmos.Game;

public class TournamentSideBuilder
{
    private readonly TournamentSide _side;

    public TournamentSideBuilder(string? name = "SIDE")
    {
        _side = new TournamentSide
        {
            Name = name,
            Id = Guid.NewGuid(),
        };
    }

    public TournamentSideBuilder WithPlayers(params TournamentPlayer[] players)
    {
        _side.Players.AddRange(players);
        return this;
    }

    public TournamentSideBuilder WithPlayer(string name, Guid? id = null)
    {
        return WithPlayers(new TournamentPlayer
        {
            Name = name,
            Id = id ?? Guid.NewGuid(),
        });
    }

    public TournamentSideBuilder WithName(string name)
    {
        _side.Name = name;
        return this;
    }

    public TournamentSide Build()
    {
        return _side;
    }
}