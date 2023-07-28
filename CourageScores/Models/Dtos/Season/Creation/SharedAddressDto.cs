using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Season.Creation;

/// <summary>
/// Represents a list of teams that can have the same address
/// </summary>
[ExcludeFromCodeCoverage]
public class SharedAddressDto
{
    /// <summary>
    /// The teams that can have the same address
    /// </summary>
    public List<TeamPlaceholderDto> Teams { get; set; } = new();
}