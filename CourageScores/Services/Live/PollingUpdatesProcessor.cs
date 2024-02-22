using System.Collections.Concurrent;
using CourageScores.Models.Dtos.Live;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Live;

public class PollingUpdatesProcessor : IWebSocketMessageProcessor, IUpdatedDataSource
{
    private readonly ConcurrentDictionary<Guid, UpdateData> _dataStore;
    private readonly ISystemClock _clock;

    public PollingUpdatesProcessor(ConcurrentDictionary<Guid, UpdateData> dataStore, ISystemClock clock)
    {
        _dataStore = dataStore;
        _clock = clock;
    }

    public void Disconnected(IWebSocketContract socket)
    {
        /*foreach (var id in socket.WebSocketDto.Subscriptions)
        {
            // TODO: Only remove if the socket was publishing data for this id...
            _dataStore.TryRemove(id, out _);
        }*/
    }

    public Task PublishUpdate(IWebSocketContract source, Guid id, object dto, CancellationToken token)
    {
        var record = new UpdateData(dto, _clock.UtcNow);
        _dataStore.AddOrUpdate(id, record, (_, _) => record);
        return Task.CompletedTask;
    }

    public Task<UpdateData?> GetUpdate(Guid id, LiveDataType? type, DateTimeOffset? since)
    {
        if (!_dataStore.TryGetValue(id, out var data))
        {
            return Task.FromResult<UpdateData?>(null);
        }

        return Task.FromResult<UpdateData?>(data.Updated >= since || since == null
            ? data
            : new UpdateData(null, data.Updated));
    }

    public class UpdateData
    {
        public object? Data { get; }
        public DateTimeOffset Updated { get; }

        public UpdateData(object? data, DateTimeOffset updated)
        {
            Data = data;
            Updated = updated;
        }
    }
}