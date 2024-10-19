using CourageScores.Models.Dtos.Season;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Season;

public class CachingSeasonService : CachingDataService<Models.Cosmos.Season.Season, SeasonDto>, ICachingSeasonService
{
    private readonly ISeasonService _seasonService;

    public CachingSeasonService(ISeasonService seasonService, ICache cache, IUserService userService,
        IHttpContextAccessor accessor)
        : base(seasonService, cache, userService, accessor)
    {
        _seasonService = seasonService;
    }

    public Task<SeasonDto?> GetLatest(CancellationToken token)
    {
        var key = new CacheKey(null, "GetLatest");
        return CacheIfNotLoggedIn(key, () => _seasonService.GetLatest(token), token);
    }

    public Task<SeasonDto?> GetForDate(DateTime referenceDate, CancellationToken token)
    {
        // NOTE: No need for this to be cached
        return _seasonService.GetForDate(referenceDate, token);
    }
}