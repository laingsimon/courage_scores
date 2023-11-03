using System.Net.WebSockets;
using System.Text;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Live;

public class WebSocketContract : IWebSocketContract
{
    private readonly IJsonSerializerService _serializerService;
    private readonly IWebSocketMessageProcessor _processor;
    private readonly WebSocket _socket;

    public WebSocketContract(WebSocket socket, IJsonSerializerService serializerService, IWebSocketMessageProcessor processor)
    {
        _socket = socket;
        _serializerService = serializerService;
        _processor = processor;
    }

    public Guid DataId { get; init; }

    public async Task Accept(CancellationToken token)
    {
        var buffer = new byte[1024 * 4]; // 4kb
        var receiveResult = await _socket.ReceiveAsync(new ArraySegment<byte>(buffer), token);
        var message = new MemoryStream();

        try
        {
            while (!receiveResult.CloseStatus.HasValue)
            {
                message.Write(buffer, 0, receiveResult.Count);

                if (receiveResult.EndOfMessage)
                {
                    var messageBytes = message.ToArray();
                    message = new MemoryStream();
                    await ProcessMessage(messageBytes, token);
                }

                receiveResult = await _socket.ReceiveAsync(new ArraySegment<byte>(buffer), token);
            }
        }
        catch (Exception exc)
        {
            await Send(new LiveMessageDto
            {
                Type = MessageType.Error,
                Message = exc.Message,
            }, token);
        }
        finally
        {
            if (_socket.CloseStatus != null)
            {
                _processor.Unregister(this);

                try
                {
                    await _socket.CloseAsync(
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

    public async Task Send(LiveMessageDto message, CancellationToken token)
    {
        var jsonString = _serializerService.SerialiseToString(message);
        var segment = new ArraySegment<byte>(Encoding.UTF8.GetBytes(jsonString));
        try
        {
            await _socket.SendAsync(segment, WebSocketMessageType.Text, true, token);
        }
        catch (WebSocketException)
        {
            // assume a disconnection
            _processor.Unregister(this);
        }
    }

    private async Task ProcessMessage(byte[] messageBytes, CancellationToken token)
    {
        var dto = _serializerService.DeserialiseTo<LiveMessageDto>(Encoding.UTF8.GetString(messageBytes));
        switch (dto.Type)
        {
            case MessageType.Polo:
                // nothing to do
                break;
            case MessageType.Marco:
                // send a message back to the client
                await Send(new LiveMessageDto
                {
                    Type = MessageType.Polo,
                }, token);
                break;
            case MessageType.Update:
                if (dto.Data != null)
                {
                    await _processor.PublishUpdate(this, dto.Data, token);
                    break;
                }
                // invalid
                await Send(new LiveMessageDto
                {
                    Type = MessageType.Error,
                    Message = "No data supplied",
                }, token);

                break;
        }
    }
}