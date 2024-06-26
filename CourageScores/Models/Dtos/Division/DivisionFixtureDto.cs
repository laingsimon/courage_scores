using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionFixtureDto
{
    public Guid Id { get; set; }
    public int? HomeScore { get; set; }
    public DivisionFixtureTeamDto HomeTeam { get; set; } = null!;
    public int? AwayScore { get; set; }
    public DivisionFixtureTeamDto? AwayTeam { get; set; }
    public bool Proposal { get; set; }
    public bool Postponed { get; set; }
    public bool IsKnockout { get; set; }
    public bool AccoladesCount { get; set; }
    public List<OtherDivisionFixtureDto> FixturesUsingAddress { get; set; } = new();
    public DivisionDto? HomeDivision { get; set; }
    public DivisionDto? AwayDivision { get; set; }
}