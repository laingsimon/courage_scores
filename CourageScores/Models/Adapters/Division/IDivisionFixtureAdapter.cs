using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Division;

public interface IDivisionFixtureAdapter
{
    Task<DivisionFixtureDto> GameToFixture(Models.Cosmos.Game.Game fixture, TeamDto? homeTeam, TeamDto? awayTeam);
    Task<DivisionFixtureDto> FoUnselectedTeam(TeamDto remainingTeam, bool isKnockout);
}