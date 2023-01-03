using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Services.Season;

public interface ISeasonService : IGenericDataService<Models.Cosmos.Season, SeasonDto>
{
    Task<ActionResultDto<List<DivisionFixtureDateDto>>> ProposeGames(AutoProvisionGamesRequest request, CancellationToken token);
    Task<SeasonDto?> GetLatest(CancellationToken token);
}