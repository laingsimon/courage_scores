namespace CourageScores.Models.Cosmos.Game;

public interface IGamePlayer
{
    Guid Id { get; }
    string Name { get; }
}