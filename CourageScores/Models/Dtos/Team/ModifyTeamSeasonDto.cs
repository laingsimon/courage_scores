using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Team;

[ExcludeFromCodeCoverage]
public class ModifyTeamSeasonDto
{
    public Guid Id { get; set; }
    public Guid SeasonId { get; set; }
    public Guid? CopyPlayersFromSeasonId { get; set; }
}