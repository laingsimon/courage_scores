using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Division;

public class DivisionFixtureTeamAdapter : IDivisionFixtureTeamAdapter
{
    public Task<DivisionFixtureTeamDto> Adapt(GameTeam team, string? address)
    {
        return Task.FromResult(new DivisionFixtureTeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Address = address,
        });
    }

    public Task<DivisionFixtureTeamDto> Adapt(TeamDto team)
    {
        return Task.FromResult(new DivisionFixtureTeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Address = team.Address,
        });
    }
}