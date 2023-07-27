using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Health;

[ExcludeFromCodeCoverage]
public class LeagueFixtureHealthDto
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public Guid HomeTeamId { get; set; }
    public string HomeTeam { get; set; } = null!;
    public string? HomeTeamAddress { get; set; }
    public Guid AwayTeamId { get; set; }
    public string AwayTeam { get; set; } = null!;
    public string? AwayTeamAddress { get; set; }
}