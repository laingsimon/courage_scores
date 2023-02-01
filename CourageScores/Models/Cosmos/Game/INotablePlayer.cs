namespace CourageScores.Models.Cosmos.Game;

public interface INotablePlayer : IGamePlayer
{
    string? Notes { get; }
}