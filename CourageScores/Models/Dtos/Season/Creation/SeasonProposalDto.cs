using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Division;

namespace CourageScores.Models.Dtos.Season.Creation;

/// <summary>
/// Represents the proposal for fixtures across all divisions in a season
/// </summary>
[ExcludeFromCodeCoverage]
public class SeasonProposalDto
{
    /// <summary>
    /// The template used to create this proposal
    /// </summary>
    public TemplateDto TemplateDto { get; set; } = null!;

    /// <summary>
    /// The divisions in this proposal, their dates and fixtures
    /// </summary>
    public List<DivisionDataDto> Divisions { get; set; } = new();

    /// <summary>
    /// The designations of placeholders to teams
    /// </summary>
    public Dictionary<TeamPlaceholderDto, DivisionTeamDto> Designations { get; set; } = new();

    /// <summary>
    /// Any errors during proposing the season
    /// </summary>
    public List<string> Errors { get; set; } = new();

    /// <summary>
    /// Any warnings during proposing the season
    /// </summary>
    public List<string> Warnings { get; set; } = new();

    /// <summary>
    /// Any messages during proposing the season
    /// </summary>
    public List<string> Messages { get; set; } = new();
}