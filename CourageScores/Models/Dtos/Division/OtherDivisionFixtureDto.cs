using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Dtos.Division;

public class OtherDivisionFixtureDto
{
    public Guid Id { get; set; }
    public Guid DivisionId { get; set; }
    public GameTeamDto Home { get; set; } = new();
    public GameTeamDto Away { get; set; } = new();
}