namespace CourageScores.Models.Cosmos.Game;

public interface IGameVisitable
{
    void Accept(IGameVisitor visitor);
}