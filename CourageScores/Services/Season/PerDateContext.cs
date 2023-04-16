using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Season;

public class PerDateContext
{
    private readonly TeamLocationRegister _teamLocationRegister;
    public List<TeamDto>? PrioritisedTeams { get; set; }
    public List<TeamDto>? PrioritisedAddresses { get; set; }
    public DivisionFixtureDateDto FixturesOnPreviousDate { get; set; } = null!;
    public List<DivisionFixtureDateDto> ExistingGames { get; set; } = null!;

    public PerDateContext(TeamLocationRegister teamLocationRegister)
    {
        _teamLocationRegister = teamLocationRegister;
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
            f.AwayTeam != null && f.AwayTeam!.Id == homeId && f.HomeTeam.Id == awayId);
    }

    public void ProposalReturned(Proposal proposal)
    {
        _teamLocationRegister.AddAway(proposal.Away.Id);
        _teamLocationRegister.AddHome(proposal.Home.Id);
    }
}