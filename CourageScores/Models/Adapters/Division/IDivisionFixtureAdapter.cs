using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Models.Adapters.Division;

public interface IDivisionFixtureAdapter
{
    Task<DivisionFixtureDto> Adapt(
        CosmosGame game,
        TeamDto? homeTeam,
        TeamDto? awayTeam,
        DivisionDto? homeDivision,
        DivisionDto? awayDivision,
        CancellationToken token);
    Task<DivisionFixtureDto> ForUnselectedTeam(
        TeamDto team,
        bool isKnockout,
        IReadOnlyCollection<CosmosGame> fixturesUsingAddress,
        DivisionDto? division,
        CancellationToken token);
}