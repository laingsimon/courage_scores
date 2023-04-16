using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Season;

public class PerDateContext
{
    private readonly TeamLocationRegister _teamLocationRegister;
    private readonly List<DivisionFixtureDateDto> _existingFixtures;
    public List<TeamDto>? PrioritisedTeams { get; set; }
    public List<TeamDto>? PrioritisedAddresses { get; set; }
    public DivisionFixtureDateDto FixturesOnPreviousDate { get; set; } = null!;

    public PerDateContext(TeamLocationRegister teamLocationRegister, List<DivisionFixtureDateDto> existingFixtures)
    {
        _teamLocationRegister = teamLocationRegister;
        _existingFixtures = existingFixtures;
    }

    public int HomeCount(Proposal proposal)
    {
        return _teamLocationRegister.GetHomeCount(proposal.Home.Id);
    }

    public int AwayCount(Proposal proposal)
    {
        return _teamLocationRegister.GetAwayCount(proposal.Away.Id);
    }

    public bool HasFixturesOnPreviousDate(Guid homeId, Guid awayId)
    {
        return FixturesOnPreviousDate.Fixtures.Any(f =>
            f.AwayTeam != null && f.AwayTeam!.Id == homeId && f.HomeTeam.Id == awayId)
            || HasExistingFixtureOnDate(FixturesOnPreviousDate.Date, homeId, awayId);
    }

    private bool HasExistingFixtureOnDate(DateTime date, Guid homeId, Guid awayId)
    {
        return _existingFixtures
            .Where(fd => fd.Date == date)
            .SelectMany(fd => fd.Fixtures)
            .Any(f => f.HomeTeam.Id == homeId && f.AwayTeam != null && f.AwayTeam.Id == awayId);
    }

    public void ProposalReturned(Proposal proposal)
    {
        _teamLocationRegister.AddAway(proposal.Away.Id);
        _teamLocationRegister.AddHome(proposal.Home.Id);
    }
}