using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Models.Dtos;

/// <summary>
/// A record of all the data within the league
/// </summary>
[ExcludeFromCodeCoverage]
public class LeagueDto : AuditedDto
{
    public string Name { get; set; } = null!;

    /// <summary>
    /// The divisions that have been defined within the league
    /// </summary>
    public List<DivisionDto> Divisions { get; set; } = new();

    /// <summary>
    /// The seasons that have been defined within the league
    /// </summary>
    public List<SeasonDto> Seasons { get; set; } = new();
}
