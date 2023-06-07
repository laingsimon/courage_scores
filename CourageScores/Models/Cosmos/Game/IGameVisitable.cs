namespace CourageScores.Models.Cosmos.Game;

public interface IGameVisitable
{
    void Accept(IVisitorScope scope, IGameVisitor visitor);
}