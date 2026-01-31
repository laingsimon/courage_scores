using CourageScores.Common;
using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.RemoteControl;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using CosmosRemoteControl = CourageScores.Models.Cosmos.RemoteControl.RemoteControl;

namespace CourageScores.Services.RemoteControl;

public class RemoteControlService : IRemoteControlService
{
    private const int MaxEntries = 10;
    private static readonly TimeSpan MaxTimeToLive = TimeSpan.FromDays(1);

    private readonly IUserService _userService;
    private readonly IGenericRepository<CosmosRemoteControl> _repository;
    private readonly ISimpleOnewayAdapter<CosmosRemoteControl, RemoteControlDto> _adapter;

    public RemoteControlService(
        IUserService userService,
        IGenericRepository<CosmosRemoteControl> repository,
        ISimpleOnewayAdapter<CosmosRemoteControl, RemoteControlDto> adapter)
    {
        _userService = userService;
        _repository = repository;
        _adapter = adapter;
    }

    public async Task<ActionResultDto<RemoteControlDto?>> Create(string pin, CancellationToken token)
    {
        var existingEntries = await _repository.GetAll(token).WhereAsync(e => e.Deleted == null).ToList();

        if (existingEntries.Count >= MaxEntries)
        {
            return await DeleteExpiredEntries(new ActionResultDto<RemoteControlDto?>
            {
                Errors =
                {
                    "Too many entries"
                }
            }, token);
        }

        if (string.IsNullOrEmpty(pin))
        {
            return await DeleteExpiredEntries(new ActionResultDto<RemoteControlDto?>
            {
                Warnings =
                {
                    "Pin not supplied"
                }
            }, token);
        }

        var newRemoteControl = new CosmosRemoteControl
        {
            Id = Guid.NewGuid(),
            Pin = pin,
            Created = DateTime.UtcNow,
        };

        await _repository.Upsert(newRemoteControl, token);

        var dto = await _adapter.Adapt(newRemoteControl, token);

        return await DeleteExpiredEntries(new ActionResultDto<RemoteControlDto?>
        {
            Success = true,
            Result = dto,
        }, token);
    }

    public async Task<ActionResultDto<RemoteControlDto?>> Delete(Guid id, string pin, CancellationToken token)
    {
        var entry = await _repository.Get(id, token);
        if (entry == null || entry.Deleted != null)
        {
            return await DeleteExpiredEntries(new ActionResultDto<RemoteControlDto?>
            {
                Warnings = { "Could not find requested entry" },
            }, token);
        }

        if (!entry.Pin.Equals(pin, StringComparison.OrdinalIgnoreCase))
        {
            return await DeleteExpiredEntries(new ActionResultDto<RemoteControlDto?>
            {
                Warnings = { "Incorrect pin" },
            }, token);
        }

        await DeleteEntry(entry, token);

        return await DeleteExpiredEntries(new ActionResultDto<RemoteControlDto?>
        {
            Success = true,
            Result = await _adapter.Adapt(entry, token),
            Messages = { "Entry will be deleted" },
        }, token);
    }

    public async Task<ActionResultDto<RemoteControlDto?>> Get(Guid id, string pin, CancellationToken token)
    {
        var entry = await _repository.Get(id, token);
        if (entry?.Deleted != null)
        {
            // treat a deleted entry as not found
            entry = null;
        }

        if (entry != null && !entry.Pin.Equals(pin, StringComparison.OrdinalIgnoreCase))
        {
            return await DeleteExpiredEntries(new ActionResultDto<RemoteControlDto?>
            {
                Warnings = { "Incorrect pin" },
            }, token);
        }

        return await DeleteExpiredEntries(new ActionResultDto<RemoteControlDto?>
        {
            Result = entry != null ? await _adapter.Adapt(entry, token) : null,
            Success = entry != null,
        }, token);
    }

    public async Task<ActionResultDto<RemoteControlDto?>> Update(Guid id, RemoteControlUpdateDto update, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            // We could add an access check here, but there's not much point, any _logged out_ user can create an entry

            return await DeleteExpiredEntries(new ActionResultDto<RemoteControlDto?>
            {
                Success = false,
                Warnings = { "Not permitted" },
            }, token);
        }

        var entry = await _repository.Get(id, token);
        if (entry == null || entry.Deleted != null)
        {
            return await DeleteExpiredEntries(new ActionResultDto<RemoteControlDto?>
            {
                Warnings = { "Could not find requested entry" },
            }, token);
        }

        if (!entry.Pin.Equals(update.Pin, StringComparison.OrdinalIgnoreCase))
        {
            return await DeleteExpiredEntries(new ActionResultDto<RemoteControlDto?>
            {
                Warnings = { "Incorrect pin" },
            }, token);
        }

        if (string.IsNullOrEmpty(update.Url) || !Uri.TryCreate(update.Url, UriKind.Relative, out var uri) || !update.Url.StartsWith("/") || update.Url.Contains("/../"))
        {
            return await DeleteExpiredEntries(new ActionResultDto<RemoteControlDto?>
            {
                Warnings = { "Url is not relative" },
            }, token);
        }

        entry.Url = uri.ToString();
        entry.UrlUpdated = DateTime.UtcNow;
        await _repository.Upsert(entry, token);

        return await DeleteExpiredEntries(new ActionResultDto<RemoteControlDto?>
        {
            Success = true,
            Result = await _adapter.Adapt(entry, token),
            Messages = { "Entry updated" },
        }, token);
    }

    private async Task<ActionResultDto<T>> DeleteExpiredEntries<T>(ActionResultDto<T> dto, CancellationToken token)
    {
        var expiredEntries = await _repository
            .GetAll(token)
            .WhereAsync(rc => rc.Deleted == null && rc.Created.Add(MaxTimeToLive) < DateTime.UtcNow)
            .ToList();

        foreach (var expiredEntry in expiredEntries)
        {
            await DeleteEntry(expiredEntry, token);
        }

        if (expiredEntries.Count > 0)
        {
            dto.Messages.Add($"Deleted {expiredEntries.Count} expired entries");
        }

        return dto;
    }

    private async Task DeleteEntry(CosmosRemoteControl entry, CancellationToken token)
    {
        entry.Deleted = DateTime.UtcNow;
        await _repository.Upsert(entry, token);
    }
}
