using System.Diagnostics;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Live;

public class PublishUpdatesProcessor : IWebSocketMessageProcessor
{
    private readonly IGroupedCollection<IWebSocketContract> _sockets;

    public PublishUpdatesProcessor(IGroupedCollection<IWebSocketContract> sockets)
    {
        _sockets = sockets;
    }

    public void Unregister(IWebSocketContract socket)
    {
        _sockets.Remove(socket.DataId, socket);
    }

    public async Task PublishUpdate(IWebSocketContract source, object dto, CancellationToken token)
    {
        var subscriptions = _sockets.GetItems(source.DataId);
        var subscriptionsToUpdate = subscriptions.Except(new[] { source }).ToArray();
        var message = new LiveMessageDto
        {
            Type = MessageType.Update,
            Data = dto,
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
}