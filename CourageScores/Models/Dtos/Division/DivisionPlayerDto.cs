using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionPlayerDto : IRankedDto
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public string Name { get; set; } = null!;
    public string Team { get; set; } = null!;
    public int Points { get; set; }
    public double WinPercentage { get; set; }
    public int OneEighties { get; set; }
    public int Over100Checkouts { get; set; }
    public bool Captain { get; set; }
    public Dictionary<DateTime, Guid> Fixtures { get; set; } = new();

    public PlayerPerformanceDto Singles { get; set; } = new();
    public PlayerPerformanceDto Pairs { get; set; } = new();
    public PlayerPerformanceDto Triples { get; set; } = new();

    public DateTime? Updated { get; set; }
    public int Rank { get; set; }
}