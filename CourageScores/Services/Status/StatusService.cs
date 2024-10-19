using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Status;
using CourageScores.Services.Identity;
using CourageScores.Services.Live;
using CourageScores.Services.Season;
using Microsoft.Extensions.Caching.Memory;

namespace CourageScores.Services.Status;

public class StatusService : IStatusService
{
    private readonly ApplicationMetrics _applicationMetrics;
    private readonly IUserService _userService;
    private readonly ICollection<IWebSocketContract> _webSockets;
    private readonly ICache _cache;
    private readonly ISeasonService _seasonService;

    public StatusService(
        ISeasonService seasonService,
        ICache cache,
        ApplicationMetrics applicationMetrics,
        IUserService userService,
        ICollection<IWebSocketContract> webSockets)
    {
        _seasonService = seasonService;
        _cache = cache;
        _applicationMetrics = applicationMetrics;
        _userService = userService;
        _webSockets = webSockets;
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

        status.CachedEntries = Try<int?>(result, () => _cache.GetKeys().Count());
        status.StartTime = _applicationMetrics.Started;
        status.UpTime = _applicationMetrics.UpTime;
        status.OpenSockets = _webSockets.Count;

        return result;
    }

    public async Task<ActionResultDto<CacheClearedDto>> ClearCache(CancellationToken token)
    {
        var dto = new CacheClearedDto();
        var result = new ActionResultDto<CacheClearedDto>
        {
            Success = true,
            Result = dto,
        };

        var user = await _userService.GetUser(token);
        if (user == null)
        {
            result.Success = false;
            result.Errors.Add("Not permitted");
            return result;
        }

        var count = 0;
        foreach (var key in _cache.GetKeys())
        {
            token.ThrowIfCancellationRequested();

            dto.Keys.Add(key.ExposeFieldsAndProperties());
            _cache.Remove(key);
            count++;
        }

        result.Messages.Add($"{count} entries removed");

        return result;
    }

    public async Task<ActionResultDto<List<Dictionary<string, object?>>>> GetCachedEntries(CancellationToken token)
    {
        var dto = new List<Dictionary<string, object?>>();
        var result = new ActionResultDto<List<Dictionary<string, object?>>>
        {
            Success = true,
            Result = dto,
        };

        var user = await _userService.GetUser(token);
        if (user == null)
        {
            result.Success = false;
            result.Errors.Add("Not permitted");
            return result;
        }

        foreach (var key in _cache.GetKeys())
        {
            token.ThrowIfCancellationRequested();

            dto.Add(key.ExposeFieldsAndProperties());
        }

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