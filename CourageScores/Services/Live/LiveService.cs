﻿using System.Net.WebSockets;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Live;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Live;

public class LiveService : ILiveService
{
    private static readonly IWebSocketContract HttpUpdateContract = new HttpUpdateWebSocketContract();

    private readonly ICollection<IWebSocketContract> _sockets;
    private readonly IWebSocketContractFactory _socketContractFactory;
    private readonly IUserService _userService;
    private readonly IUpdatedDataSource _updatedDataSource;
    private readonly IWebSocketMessageProcessor _webSocketMessageProcessor;

    public LiveService(
        ICollection<IWebSocketContract> sockets,
        IWebSocketContractFactory socketContractFactory,
        IUserService userService,
        IUpdatedDataSource updatedDataSource,
        IWebSocketMessageProcessor webSocketMessageProcessor)
    {
        _sockets = sockets;
        _socketContractFactory = socketContractFactory;
        _userService = userService;
        _updatedDataSource = updatedDataSource;
        _webSocketMessageProcessor = webSocketMessageProcessor;
    }

    public async Task Accept(WebSocket webSocket, string originatingUrl, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user?.Access?.UseWebSockets != true)
        {
            return;
        }

        var contract = await _socketContractFactory.Create(webSocket, originatingUrl, token);
        _sockets.Add(contract);
        await contract.Accept(token);
    }

    public async Task<ActionResultDto<List<WebSocketDto>>> GetSockets(CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return Error<List<WebSocketDto>>("Not logged in");
        }

        if (user.Access?.ManageSockets != true)
        {
            return Error<List<WebSocketDto>>("Not permitted");
        }

        return new ActionResultDto<List<WebSocketDto>>
        {
            Success = true,
            Result = _sockets.Select(s => s.WebSocketDto).ToList(),
        };
    }

    public async Task<ActionResultDto<WebSocketDto>> CloseSocket(Guid socketId, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return Error<WebSocketDto>("Not logged in");
        }

        if (user.Access?.ManageSockets != true)
        {
            return Error<WebSocketDto>("Not permitted");
        }

        var socket = _sockets.SingleOrDefault(s => s.WebSocketDto.Id == socketId);
        if (socket == null)
        {
            return Error<WebSocketDto>("Not found");
        }

        await socket.Close(token);

        return new ActionResultDto<WebSocketDto>
        {
            Success = true,
            Result = socket.WebSocketDto,
            Messages =
            {
                "Socket closed",
            },
        };
    }

    public async Task<ActionResultDto<UpdatedDataDto?>> GetUpdate(Guid id, LiveDataType type, DateTimeOffset? lastUpdate, CancellationToken token)
    {
        var update = await _updatedDataSource.GetUpdate(id, type, lastUpdate);
        if (update == null)
        {
            return new ActionResultDto<UpdatedDataDto?>
            {
                Success = true,
                Result = null,
                Warnings =
                {
                    "Entity is not being live-updated",
                },
            };
        }

        if (update.Data == null)
        {
            // no update since <lastUpdate>
            return new ActionResultDto<UpdatedDataDto?>
            {
                Success = true,
                Result = new UpdatedDataDto
                {
                    LastUpdate = update.Updated,
                },
                Messages =
                {
                    $"Last update: {update.Updated}",
                },
            };
        }

        return new ActionResultDto<UpdatedDataDto?>
        {
            Success = true,
            Result = new UpdatedDataDto
            {
                Data = update.Data,
                LastUpdate = update.Updated,
            },
        };
    }

    public async Task ProcessUpdate(Guid id, LiveDataType type, object data, CancellationToken token)
    {
        await _webSocketMessageProcessor.PublishUpdate(HttpUpdateContract, id, type, data, token);
    }

    private static ActionResultDto<T> Error<T>(string message)
    {
        return new ActionResultDto<T>
        {
            Errors =
            {
                message,
            },
        };
    }

    private class HttpUpdateWebSocketContract : IWebSocketContract
    {
        public WebSocketDto WebSocketDto { get; } = new WebSocketDto();

        public Task Accept(CancellationToken token)
        {
            return Task.CompletedTask;
        }

        public Task Send(LiveMessageDto message, CancellationToken token)
        {
            throw new NotSupportedException();
        }

        public bool IsSubscribedTo(Guid id)
        {
            return false;
        }

        public Task Close(CancellationToken token)
        {
            return Task.CompletedTask;
        }
    }
}