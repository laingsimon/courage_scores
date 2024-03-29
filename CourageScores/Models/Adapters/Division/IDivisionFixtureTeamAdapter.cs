using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Division;

public interface IDivisionFixtureTeamAdapter
{
    Task<DivisionFixtureTeamDto> Adapt(GameTeam team, string? address, CancellationToken token);
    Task<DivisionFixtureTeamDto> Adapt(TeamDto team, CancellationToken token);
}