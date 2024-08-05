using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Tests.Models.Cosmos.Game;

public class GameMatchOptionBuilder
{
    private readonly GameMatchOption _matchOption;

    public GameMatchOptionBuilder(GameMatchOption? matchOption = null)
    {
        _matchOption = matchOption ?? new GameMatchOption();
    }

    public GameMatchOption Build()
    {
        return _matchOption;
    }

    public GameMatchOptionBuilder NumberOfLegs(int numberOfLegs)
    {
        _matchOption.NumberOfLegs = numberOfLegs;
        return this;
    }
}