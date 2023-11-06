using System.Diagnostics;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Live;

public class PublishUpdatesProcessor : IWebSocketMessageProcessor
{
    private readonly ICollection<IWebSocketContract> _sockets;

    public PublishUpdatesProcessor(ICollection<IWebSocketContract> sockets)
    {
        _sockets = sockets;
    }

    public void Disconnected(IWebSocketContract socket)
    {
        _sockets.Remove(socket);
    }

    public async Task PublishUpdate(IWebSocketContract source, Guid id, object dto, CancellationToken token)
    {
        var subscriptionsToUpdate = _sockets.Where(s => s.IsSubscribedTo(id)).Except(new[] { source }).ToArray();
        var message = new LiveMessageDto
        {
            Type = MessageType.Update,
            Data = dto,
            Id = id,
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