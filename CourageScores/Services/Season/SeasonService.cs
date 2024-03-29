using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos.Season;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Season;

public class SeasonService : GenericDataService<Models.Cosmos.Season.Season, SeasonDto>, ISeasonService
{
    private readonly ISystemClock _clock;

    public SeasonService(
        IGenericRepository<Models.Cosmos.Season.Season> repository,
        IAdapter<Models.Cosmos.Season.Season, SeasonDto> adapter,
        IUserService userService,
        IAuditingHelper auditingHelper,
        ISystemClock clock,
        IActionResultAdapter actionResultAdapter)
        : base(repository, adapter, userService, auditingHelper, actionResultAdapter)
    {
        _clock = clock;
    }

    public async Task<SeasonDto?> GetLatest(CancellationToken token)
    {
        var today = _clock.UtcNow.Date;
        return await GetForDate(today, token);
    }

    public async Task<SeasonDto?> GetForDate(DateTime referenceDate, CancellationToken token)
    {
        return (await GetAll(token).ToList()).Where(s => s.StartDate <= referenceDate && s.EndDate >= referenceDate).MaxBy(s => s.EndDate);
    }
}