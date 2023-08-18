using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Status;
using CourageScores.Services.Season;
using Microsoft.Extensions.Caching.Memory;

namespace CourageScores.Services.Status;

public class StatusService : IStatusService
{
    private readonly ApplicationMetrics _applicationMetrics;
    private readonly IMemoryCache _memoryCache;
    private readonly ISeasonService _seasonService;

    public StatusService(ISeasonService seasonService, IMemoryCache memoryCache, ApplicationMetrics applicationMetrics)
    {
        _seasonService = seasonService;
        _memoryCache = memoryCache;
        _applicationMetrics = applicationMetrics;
    }

    public async Task<ActionResultDto<ServiceStatusDto>> GetStatus(CancellationToken token)
    {
        var status = new ServiceStatusDto();
        var result = new ActionResultDto<ServiceStatusDto>
        {
            Success = true,
            Result = status,
        };

        var latestSeason = await Try(result, async () =>
        {
            var season = await _seasonService.GetLatest(token);
            status.DatabaseAccess = true;
            return season;
        });

        status.SeasonStatus = Try(result, () =>
        {
            if (latestSeason?.IsCurrent == true)
            {
                return ServiceStatusDto.SeasonStatusEnum.InSeason;
            }

            return status.DatabaseAccess
                ? ServiceStatusDto.SeasonStatusEnum.OutOfSeason
                : default;
        });

        status.CachedEntries = Try<int?>(result, () => ((MemoryCache)_memoryCache).Count);
        status.StartTime = _applicationMetrics.Started;
        status.UpTime = _applicationMetrics.UpTime;

        return result;
    }

    private static async Task<T?> Try<T>(ActionResultDto<ServiceStatusDto> result, Func<Task<T>> action)
    {
        try
        {
            return await action();
        }
        catch (Exception exc)
        {
            result.Success = false;
            result.Errors.Add(exc.Message);
            return default;
        }
    }

    private static T Try<T>(ActionResultDto<ServiceStatusDto> result, Func<T> action)
    {
        try
        {
            return action();
        }
        catch (Exception exc)
        {
            result.Success = false;
            result.Errors.Add(exc.Message);
#pragma warning disable CS8603 // Possible null reference return.
            return default;
#pragma warning restore CS8603 // Possible null reference return.
        }
    }
}