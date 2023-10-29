using System.Diagnostics;
using System.Net.WebSockets;
using System.Text;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Game;

public class SaygLiveService : ISaygLiveService
{
    private readonly IWebSocketCollection _webSockets;
    private readonly IJsonSerializerService _serializerService;

    public SaygLiveService(IWebSocketCollection webSockets, IJsonSerializerService serializerService)
    {
        _webSockets = webSockets;
        _serializerService = serializerService;
    }

    public async Task Connect(WebSocket webSocket, Guid saygId, CancellationToken token)
    {
        var buffer = new byte[1024 * 4]; // 10kb
        var receiveResult = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), token);
        var message = new MemoryStream();
        _webSockets.Add(saygId, webSocket);

        try
        {
            while (!receiveResult.CloseStatus.HasValue)
            {
                message.Write(buffer, 0, receiveResult.Count);

                if (receiveResult.EndOfMessage)
                {
                    var messageBytes = message.ToArray();
                    message = new MemoryStream();
                    await ProcessMessage(webSocket, messageBytes, token);
                }

                receiveResult = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), token);
            }
        }
        catch (Exception exc)
        {
            await Send(new SaygLiveMessageDto
            {
                Type = SaygLiveMessageDto.MessageType.Error,
                Message = exc.Message,
            }, webSocket, token);
        }
        finally
        {
            if (webSocket.CloseStatus != null)
            {
                _webSockets.Remove(webSocket);

                try
                {
                    await webSocket.CloseAsync(
                        receiveResult.CloseStatus!.Value,
                        receiveResult.CloseStatusDescription,
                        token);
                }
                catch (TaskCanceledException)
                {
                    // do nothing
                }
            }
        }
    }

    private async Task ProcessMessage(WebSocket webSocket, byte[] messageBytes, CancellationToken token)
    {
        var dto = _serializerService.DeserialiseTo<SaygLiveMessageDto>(Encoding.UTF8.GetString(messageBytes));
        switch (dto.Type)
        {
            case SaygLiveMessageDto.MessageType.Polo:
                // nothing to do
                break;
            case SaygLiveMessageDto.MessageType.Marco:
                // send a message back to the client
                await Send(new SaygLiveMessageDto
                {
                    Type = SaygLiveMessageDto.MessageType.Polo,
                }, webSocket, token);
                break;
            case SaygLiveMessageDto.MessageType.Update:
                if (dto.Data != null)
                {
                    await ProcessClientUpdate(webSocket, dto.Data, token);
                    break;
                }
                // invalid
                await Send(new SaygLiveMessageDto
                {
                    Type = SaygLiveMessageDto.MessageType.Error,
                    Message = "No data supplied",
                }, webSocket, token);

                break;
        }
    }

    private async Task ProcessClientUpdate(WebSocket source, RecordedScoreAsYouGoDto saygData, CancellationToken token)
    {
        var subscriptions = _webSockets.GetSockets(saygData.Id);
        var subscriptionsToUpdate = subscriptions.Except(new[] { source }).ToArray();
        var message = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Update,
            Data = saygData,
        };

        foreach (var subscription in subscriptionsToUpdate)
        {
            try
            {
                await Send(message, subscription, token);
            }
            catch (Exception exc)
            {
                Trace.TraceError($"Error sending update to subscribed client: {exc.Message}");
            }
        }
    }

    private async Task Send<T>(T message, WebSocket webSocket, CancellationToken token)
    {
        var jsonString = _serializerService.SerialiseToString(message);
        var segment = new ArraySegment<byte>(Encoding.UTF8.GetBytes(jsonString));
        try
        {
            await webSocket.SendAsync(segment, WebSocketMessageType.Text, true, token);
        }
        catch (WebSocketException)
        {
            // assume a disconnection
            _webSockets.Remove(webSocket);
        }
    }
}