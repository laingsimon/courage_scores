using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionPlayerDto
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public int Rank { get; set; }
    public string Name { get; set; } = null!;
    public string Team { get; set; } = null!;
    public int PlayedSingles { get; set; }
    public int WonSingles { get; set; }
    public int LostSingles { get; set; }
    public int Points { get; set; }
    public double WinPercentage { get; set; }
    public int OneEighties { get; set; }
    public int Over100Checkouts { get; set; }
    public bool Captain { get; set; }
    public Dictionary<DateTime, Guid> Fixtures { get; set; } = new();

    public int PlayedPairs { get; set; }
    public int WonPairs { get; set; }
    public int DrawPairs { get; set; }
    public int PlayedTriples { get; set; }
    public int WonTriples { get; set; }
    public int DrawTriples { get; set; }
}
