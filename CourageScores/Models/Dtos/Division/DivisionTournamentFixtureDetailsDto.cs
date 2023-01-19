using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Dtos.Division;

public class DivisionTournamentFixtureDetailsDto
{
    public Guid Id { get; set; }
    public string Address { get; set; } = null!;
    public string? Notes { get; set; }
    public DateTime Date { get; set; }
    public Guid SeasonId { get; set; }
    public string? Type { get; set; }
    public TournamentSideDto? WinningSide { get; set; }
    public bool Proposed { get; set; }
    public List<Guid> Players { get; set; } = new();
    public List<TournamentSideDto> Sides { get; set; } = new();
}
