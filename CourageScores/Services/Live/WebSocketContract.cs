using System.Net.WebSockets;
using System.Text;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Live;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Live;

public class WebSocketContract : IWebSocketContract
{
    private readonly IJsonSerializerService _serializerService;
    private readonly IWebSocketMessageProcessor _processor;
    private readonly ISystemClock _systemClock;
    private readonly WebSocket _socket;
    private readonly HashSet<Guid> _subscribedIds = new HashSet<Guid>();

    public WebSocketContract(
        WebSocket socket,
        IJsonSerializerService serializerService,
        IWebSocketMessageProcessor processor,
        WebSocketDto webSocketDto,
        ISystemClock systemClock)
    {
        WebSocketDto = webSocketDto;
        _socket = socket;
        _serializerService = serializerService;
        _processor = processor;
        _systemClock = systemClock;
    }

    public WebSocketDto WebSocketDto { get; }

    public bool IsSubscribedTo(Guid id)
    {
        return _subscribedIds.Contains(id);
    }

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
                _processor.Disconnected(this);

                try
                {
                    await _socket.CloseAsync(
                        receiveResult.CloseStatus!.Value,
                        receiveResult.CloseStatusDescription,
                        token);
                }
                catch (WebSocketException)
                {
                    // do nothing
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
            WebSocketDto.LastSent = _systemClock.UtcNow;
        }
        catch (WebSocketException)
        {
            // assume a disconnection
            _processor.Disconnected(this);
        }
    }

    public async Task Close(CancellationToken token)
    {
        try
        {
            await _socket.CloseAsync(
                WebSocketCloseStatus.NormalClosure,
                "Forced closure",
                token);
        }
        catch (WebSocketException)
        {
            // do nothing
        }

        _processor.Disconnected(this);
    }

    private async Task ProcessMessage(byte[] messageBytes, CancellationToken token)
    {
        WebSocketDto.LastReceipt = _systemClock.UtcNow;
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
                if (dto.Data != null && dto.Id != null)
                {
                    await _processor.PublishUpdate(this, dto.Id.Value, dto.Data, token);
                    break;
                }
                // invalid
                await Send(new LiveMessageDto
                {
                    Type = MessageType.Error,
                    Message = "Data and Id is required",
                }, token);

                break;
            case MessageType.Subscribed:
                if (dto.Id != null)
                {
                    _subscribedIds.Add(dto.Id.Value);
                    break;
                }

                // invalid
                await Send(new LiveMessageDto
                {
                    Type = MessageType.Error,
                    Message = "Id is required",
                }, token);

                break;
            case MessageType.Unsubscribed:
                if (dto.Id != null)
                {
                    _subscribedIds.Remove(dto.Id.Value);
                    break;
                }

                // invalid
                await Send(new LiveMessageDto
                {
                    Type = MessageType.Error,
                    Message = "Id is required",
                }, token);

                break;
            default:
                await Send(new LiveMessageDto
                {
                    Type = MessageType.Error,
                    Message = $"Unsupported type: {dto.Type}",
                }, token);
                break;
        }
    }
}