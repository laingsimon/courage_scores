using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Division;

public class DivisionFixtureTeamAdapter : IDivisionFixtureTeamAdapter
{
    public Task<DivisionFixtureTeamDto> Adapt(GameTeam team, string? address, CancellationToken token)
    {
        return Task.FromResult(new DivisionFixtureTeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Address = address ?? team.Name,
        });
    }

    public Task<DivisionFixtureTeamDto> Adapt(TeamDto team, CancellationToken token)
    {
        return Task.FromResult(new DivisionFixtureTeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Address = team.AddressOrName(),
        });
    }
}