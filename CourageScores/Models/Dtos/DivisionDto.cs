using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos;

/// <summary>
/// A record of a division within the league
/// </summary>
[ExcludeFromCodeCoverage]
public class DivisionDto : AuditedDto
{
    /// <summary>
    /// The name for the division
    /// </summary>
    public string Name { get; set; } = null!;
}