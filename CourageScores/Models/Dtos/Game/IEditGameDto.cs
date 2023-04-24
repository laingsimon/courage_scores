namespace CourageScores.Models.Dtos.Game;

public interface IEditGameDto : IGameDto
{
    Guid Id { get; set; }
    Guid DivisionId { get; set; }
    Guid SeasonId { get; set; }
}