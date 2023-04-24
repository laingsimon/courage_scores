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

    public async Task<DivisionFixtureDto> Adapt(Cosmos.Game.Game game, TeamDto? homeTeam, TeamDto? awayTeam, CancellationToken token)
    {
        var matches = game.Matches.Where(m => m.Deleted == null).ToArray();

        return new DivisionFixtureDto
        {
            Id = game.Id,
            HomeTeam = await _divisionFixtureTeamAdapter.Adapt(game.Home, homeTeam?.Address, token),
            AwayTeam = await _divisionFixtureTeamAdapter.Adapt(game.Away, awayTeam?.Address, token),
            HomeScore = game.Matches.Any()
                ? matches.Count(m => m.HomeScore > m.AwayScore)
                : null,
            AwayScore = game.Matches.Any()
                ? matches.Count(m => m.AwayScore > m.HomeScore)
                : null,
            Postponed = game.Postponed,
            IsKnockout = game.IsKnockout,
            AccoladesCount = game.AccoladesCount,
        };
    }

    public async Task<DivisionFixtureDto> ForUnselectedTeam(TeamDto team, bool isKnockout, CancellationToken token)
    {
        return new DivisionFixtureDto
        {
            Id = team.Id,
            AwayScore = null,
            HomeScore = null,
            AwayTeam = null,
            HomeTeam = await _divisionFixtureTeamAdapter.Adapt(team, token),
            IsKnockout = isKnockout,
            Postponed = false,
            Proposal = false,
            AccoladesCount = true,
        };
    }
}