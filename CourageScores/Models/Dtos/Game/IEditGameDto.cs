namespace CourageScores.Models.Dtos.Game;

public interface IEditGameDto : IGameDto
{
    Guid DivisionId { get; set; }
    Guid SeasonId { get; set; }
}