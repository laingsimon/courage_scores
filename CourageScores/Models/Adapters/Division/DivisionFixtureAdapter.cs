using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Division;

public class DivisionFixtureAdapter : IDivisionFixtureAdapter
{
    private readonly IDivisionFixtureTeamAdapter _divisionFixtureTeamAdapter;

    public DivisionFixtureAdapter(IDivisionFixtureTeamAdapter divisionFixtureTeamAdapter)
    {
        _divisionFixtureTeamAdapter = divisionFixtureTeamAdapter;
    }

    public async Task<DivisionFixtureDto> GameToFixture(Models.Cosmos.Game.Game fixture, TeamDto? homeTeam, TeamDto? awayTeam)
    {
        return new DivisionFixtureDto
        {
            Id = fixture.Id,
            AwayTeam = await _divisionFixtureTeamAdapter.Adapt(fixture.Away, awayTeam?.Address),
            HomeTeam = await _divisionFixtureTeamAdapter.Adapt(fixture.Home, homeTeam?.Address),
            AwayScore = fixture.Matches.Any()
                ? fixture.Matches.Where(m => m.Deleted == null).Count(m => m.AwayScore > m.HomeScore)
                : null,
            HomeScore = fixture.Matches.Any()
                ? fixture.Matches.Where(m => m.Deleted == null).Count(m => m.HomeScore > m.AwayScore)
                : null,
            Postponed = fixture.Postponed,
            IsKnockout = fixture.IsKnockout,
        };
    }

    public async Task<DivisionFixtureDto> FoUnselectedTeam(TeamDto remainingTeam, bool isKnockout)
    {
        return new DivisionFixtureDto
        {
            Id = remainingTeam.Id,
            AwayScore = null,
            HomeScore = null,
            AwayTeam = null,
            HomeTeam = await _divisionFixtureTeamAdapter.Adapt(remainingTeam),
            IsKnockout = isKnockout,
        };
    }
}