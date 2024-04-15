using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Services.Game;

public interface IGameService : IGenericDataService<Models.Cosmos.Game.Game, GameDto>
{
    Task<ActionResultDto<List<string>>> DeleteUnplayedLeagueFixtures(Guid seasonId, bool dryRun, CancellationToken token);
}