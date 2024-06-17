using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Tests.Models.Cosmos.Game;

public class GameMatchBuilder
{
    private readonly GameMatch _match;

    public GameMatchBuilder(GameMatch? match = null)
    {
        _match = match ?? new GameMatch();
    }

    public GameMatch Build()
    {
        return _match;
    }

    public GameMatchBuilder WithScores(int home, int away)
    {
        _match.HomeScore = home;
        _match.AwayScore = away;
        return this;
    }

    public GameMatchBuilder WithHomePlayers(params Guid[] playerIds)
    {
        _match.HomePlayers.AddRange(playerIds.Select(id => new GamePlayer { Id = id }));
        return this;
    }

    public GameMatchBuilder WithAwayPlayers(params Guid[] playerIds)
    {
        _match.AwayPlayers.AddRange(playerIds.Select(id => new GamePlayer { Id = id }));
        return this;
    }

    public GameMatchBuilder WithHomePlayers(params GamePlayer[] players)
    {
        _match.HomePlayers.AddRange(players);
        return this;
    }

    public GameMatchBuilder WithAwayPlayers(params GamePlayer[] players)
    {
        _match.AwayPlayers.AddRange(players);
        return this;
    }
}