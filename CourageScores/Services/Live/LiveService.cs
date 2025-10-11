﻿using System.Diagnostics.CodeAnalysis;
using System.Net.WebSockets;
using System.Runtime.CompilerServices;
using CourageScores.Common;
using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Live;
using CourageScores.Models.Live;
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
    private readonly ISimpleOnewayAdapter<WebSocketDetail, WebSocketDto> _webSocketDetailAdapter;
    private readonly ISimpleOnewayAdapter<WatchableData, WatchableDataDto> _watchableDataAdapter;

    public LiveService(
        ICollection<IWebSocketContract> sockets,
        IWebSocketContractFactory socketContractFactory,
        IUserService userService,
        IUpdatedDataSource updatedDataSource,
        IWebSocketMessageProcessor webSocketMessageProcessor,
        ISimpleOnewayAdapter<WebSocketDetail, WebSocketDto> webSocketDetailAdapter,
        ISimpleOnewayAdapter<WatchableData, WatchableDataDto> watchableDataAdapter)
    {
        _sockets = sockets;
        _socketContractFactory = socketContractFactory;
        _userService = userService;
        _updatedDataSource = updatedDataSource;
        _webSocketMessageProcessor = webSocketMessageProcessor;
        _webSocketDetailAdapter = webSocketDetailAdapter;
        _watchableDataAdapter = watchableDataAdapter;
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
            Result = await _sockets.SelectAsync(s => _webSocketDetailAdapter.Adapt(s.Details, token)).ToList(),
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

        var socket = _sockets.SingleOrDefault(s => s.Details.Id == socketId);
        if (socket == null)
        {
            return Error<WebSocketDto>("Not found");
        }

        await socket.Close(token);

        return new ActionResultDto<WebSocketDto>
        {
            Success = true,
            Result = await _webSocketDetailAdapter.Adapt(socket.Details, token),
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

    public async IAsyncEnumerable<WatchableDataDto> GetWatchableData(LiveDataType? type, [EnumeratorCancellation] CancellationToken token)
    {
        var lookups = new Dictionary<Guid, List<WatchableDataDto>>();

        await foreach (var detail in _webSocketMessageProcessor.GetWatchableData(token))
        {
            var dto = await _watchableDataAdapter.Adapt(detail, token);
            if (type == null || dto.DataType == type)
            {
                if (!lookups.TryGetValue(dto.Id, out var dtos))
                {
                    dtos = new List<WatchableDataDto>();
                    lookups.Add(dto.Id, dtos);
                }

                dtos.Add(dto);
            }
        }

        foreach (var pair in lookups)
        {
            var preferredDto = pair.Value.OrderBy(GetPublicationModePreference).First();
            yield return preferredDto;
        }
    }

    private static int GetPublicationModePreference(WatchableDataDto dto)
    {
        switch (dto.PublicationMode)
        {
            case PublicationMode.WebSocket:
                return 1;
            case PublicationMode.Polling:
                return 2;
            default:
                return 3;
        }
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

    [ExcludeFromCodeCoverage]
    private class HttpUpdateWebSocketContract : IWebSocketContract
    {
        public WebSocketDetail Details { get; } = new WebSocketDetail();

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