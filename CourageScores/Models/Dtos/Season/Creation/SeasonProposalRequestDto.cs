using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Season.Creation;

[ExcludeFromCodeCoverage]
public class SeasonProposalRequestDto
{
    /// <summary>
    /// The id of the season to propose fixtures for
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// The id of the template to use when proposing fixtures
    /// </summary>
    public Guid? TemplateId { get; set; }

    /// <summary>
    /// The template to use to propose fixtures
    /// </summary>
    public DivisionTemplateDto? Template { get; set; }

    /// <summary>
    /// Any dates that should be skipped
    ///
    /// If empty, will be populated with any dates in the season that have fixtures, tournaments or notes
    /// </summary>
    public List<DateTime> SkipDates { get; set; } = new();

    /// <summary>
    /// Pre-define any team designations rather than letting them be worked out/randomised
    /// </summary>
    public Dictionary<Guid, TeamPlaceholderDto> Designations { get; set; } = new();
}