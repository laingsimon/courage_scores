using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Services.Report;

[ExcludeFromCodeCoverage]
public class PlayerDetails
{
    public string PlayerName { get; init; } = null!;
    public Guid TeamId { get; init; }
    public string TeamName { get; init; } = null!;
    public Guid DivisionId { get; init; }
}