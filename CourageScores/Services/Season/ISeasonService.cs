using CourageScores.Models.Dtos.Season;

namespace CourageScores.Services.Season;

public interface ISeasonService : IGenericDataService<Models.Cosmos.Season.Season, SeasonDto>
{
    Task<SeasonDto?> GetLatest(CancellationToken token);
    Task<SeasonDto?> GetForDate(DateTime referenceDate, CancellationToken token);
}