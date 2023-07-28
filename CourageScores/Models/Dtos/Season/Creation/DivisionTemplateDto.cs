using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Season.Creation;

/// <summary>
/// Represents a template for a division in a new season
/// </summary>
[ExcludeFromCodeCoverage]
public class DivisionTemplateDto
{
    /// <summary>
    /// The team placeholders for this template
    /// </summary>
    public List<TeamPlaceholderDto> Placeholders { get; set; } = new();

    /// <summary>
    /// Which teams can have the same address
    /// </summary>
    public List<SharedAddressDto> SharedAddresses { get; set; } = new();

    /// <summary>
    /// Which fixture dates can be created for this division
    /// </summary>
    public List<DateTemplateDto> Dates { get; set; } = new();
}