using System.Net.WebSockets;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Live;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Live;

public class LiveService : ILiveService
{
    private readonly ICollection<IWebSocketContract> _sockets;
    private readonly IWebSocketContractFactory _socketContractFactory;
    private readonly IUserService _userService;

    public LiveService(
        ICollection<IWebSocketContract> sockets,
        IWebSocketContractFactory socketContractFactory,
        IUserService userService)
    {
        _sockets = sockets;
        _socketContractFactory = socketContractFactory;
        _userService = userService;
    }

    public async Task Accept(WebSocket webSocket, string originatingUrl, CancellationToken token)
    {
        var contract = await _socketContractFactory.Create(webSocket, originatingUrl, token);
        _sockets.Add(contract);
        await contract.Accept(token);
    }

    public async Task<ActionResultDto<List<WebSocketDto>>> GetSockets(CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return Error("Not logged in");
        }

        if (user.Access?.ManageSockets != true)
        {
            return Error("Not permitted");
        }

        return new ActionResultDto<List<WebSocketDto>>
        {
            Success = true,
            Result = _sockets.Select(s => s.WebSocketDto).ToList(),
        };
    }

    private static ActionResultDto<List<WebSocketDto>> Error(string message)
    {
        return new ActionResultDto<List<WebSocketDto>>
        {
            Errors =
            {
                message,
            },
        };
    }
}