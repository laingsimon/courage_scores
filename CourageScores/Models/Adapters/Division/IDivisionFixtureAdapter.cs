using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Division;

public interface IDivisionFixtureAdapter
{
    Task<DivisionFixtureDto> Adapt(Models.Cosmos.Game.Game game, TeamDto? homeTeam, TeamDto? awayTeam, CancellationToken token);
    Task<DivisionFixtureDto> ForUnselectedTeam(TeamDto team, bool isKnockout, IReadOnlyCollection<Cosmos.Game.Game> fixturesUsingAddress, CancellationToken token);
}