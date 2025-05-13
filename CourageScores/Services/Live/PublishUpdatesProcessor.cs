using System.Diagnostics;
using System.Runtime.CompilerServices;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Live;
using CourageScores.Models.Live;

namespace CourageScores.Services.Live;

public class PublishUpdatesProcessor : IWebSocketMessageProcessor
{
    private readonly ICollection<IWebSocketContract> _sockets;
    private readonly TimeProvider _clock;

    public PublishUpdatesProcessor(ICollection<IWebSocketContract> sockets, TimeProvider clock)
    {
        _sockets = sockets;
        _clock = clock;
    }

    public void Disconnected(IWebSocketContract socket)
    {
        _sockets.Remove(socket);
    }

    public async Task PublishUpdate(IWebSocketContract? source, Guid id, LiveDataType dataType, object dto, CancellationToken token)
    {
        if (source != null)
        {
            SetPublishing(source.Details, id, dataType);
        }

        var subscriptionsToUpdate = _sockets.Where(s => s.IsSubscribedTo(id)).Except([source]).Cast<IWebSocketContract>().ToArray();
        var message = new LiveMessageDto
        {
            Type = MessageType.Update,
            Data = dto,
            Id = id,
            DataType = dataType,
        };

        foreach (var subscription in subscriptionsToUpdate)
        {
            try
            {
                await subscription.Send(message, token);
            }
            catch (Exception exc)
            {
                Trace.TraceError($"Error sending update to subscribed client: {exc.Message}");
            }
        }
    }

    public async IAsyncEnumerable<WatchableData> GetWatchableData([EnumeratorCancellation] CancellationToken token)
    {
        foreach (var socket in _sockets)
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            var publications = socket.Details.Publishing.ToList();
            foreach (var publication in publications)
            {
                if (token.IsCancellationRequested)
                {
                    break;
                }

                yield return await GetWatchableData(socket.Details, publication);
            }
        }
    }

    private static Task<WatchableData> GetWatchableData(WebSocketDetail details, WebSocketPublication publication)
    {
        return Task.FromResult(new WatchableData(details, publication, PublicationMode.WebSocket));
    }

    private void SetPublishing(WebSocketDetail details, Guid id, LiveDataType dataType)
    {
        var existingDetails = details.Publishing.SingleOrDefault(p => p.Id == id);
        if (existingDetails == null)
        {
            existingDetails = new WebSocketPublication
            {
                Id = id,
                DataType = dataType,
            };
            details.Publishing.Add(existingDetails);
        }

        existingDetails.LastUpdate = _clock.GetUtcNow();
    }
}