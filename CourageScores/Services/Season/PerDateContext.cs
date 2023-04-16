using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Season;

public class PerDateContext
{
    public List<TeamDto>? PrioritisedTeams { get; set; }
    public List<TeamDto>? PrioritisedAddresses { get; set; }
    public TeamLocationRegister TeamLocationRegister { get; set; } = null!;
    public DivisionFixtureDateDto FixturesOnPreviousDate { get; set; } = null!;
}