namespace CourageScores.Models.Dtos.Game;

public interface IGameDto
{
    string Address { get; set; }
    DateTime Date { get; set; }
    bool Postponed { get; set; }
    bool IsKnockout { get; set; }
    bool AccoladesCount { get; set; }
}