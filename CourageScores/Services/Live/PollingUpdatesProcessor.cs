using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using CourageScores.Models.Dtos.Live;
using CourageScores.Models.Live;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Live;

public class PollingUpdatesProcessor : IWebSocketMessageProcessor, IUpdatedDataSource
{
    private readonly ConcurrentDictionary<Guid, UpdateData> _dataStore;
    private readonly TimeProvider _clock;
    private readonly IUserService _userService;

    public PollingUpdatesProcessor(ConcurrentDictionary<Guid, UpdateData> dataStore, TimeProvider clock, IUserService userService)
    {
        _dataStore = dataStore;
        _clock = clock;
        _userService = userService;
    }

    public void Disconnected(IWebSocketContract socket)
    {
        // nothing to do
    }

    public async Task PublishUpdate(IWebSocketContract source, Guid id, LiveDataType dataType, object dto, CancellationToken token)
    {
        var user = await _userService.GetUser(token);

        var record = new UpdateData(dataType, id, dto, _clock.GetUtcNow(), user?.Name);
        _dataStore.AddOrUpdate(id, record, (_, _) => record);
    }

    public Task<UpdateData?> GetUpdate(Guid id, LiveDataType type, DateTimeOffset? since)
    {
        if (!_dataStore.TryGetValue(id, out var data))
        {
            return Task.FromResult<UpdateData?>(null);
        }

        return Task.FromResult<UpdateData?>(data.Updated >= since || since == null
            ? data
            : new UpdateData(type, id, null, data.Updated, null));
    }

    public async IAsyncEnumerable<WatchableData> GetWatchableData([EnumeratorCancellation] CancellationToken token)
    {
        foreach (var store in _dataStore.ToList())
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            yield return await GetWatchableData(store.Value);
        }
    }

    private Task<WatchableData> GetWatchableData(UpdateData data)
    {
        var publication = new WebSocketPublication
        {
            Id = data.Id,
            LastUpdate = data.Updated,
            DataType = data.Type,
        };
        var details = new WebSocketDetail
        {
            UserName = data.UserName,
        };
        return Task.FromResult(new WatchableData(details, publication, PublicationMode.Polling));
    }

    public class UpdateData
    {
        public Guid Id { get; }
        public object? Data { get; }
        public DateTimeOffset Updated { get; }
        public LiveDataType Type { get; }
        public string? UserName { get; }

        public UpdateData(LiveDataType type, Guid id, object? data, DateTimeOffset updated, string? userName)
        {
            Type = type;
            Id = id;
            Data = data;
            Updated = updated;
            UserName = userName;
        }
    }
}