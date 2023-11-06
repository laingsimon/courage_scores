using System.Net.WebSockets;

namespace CourageScores.Services.Live;

public class LiveService : ILiveService
{
    private readonly ICollection<IWebSocketContract> _sockets;
    private readonly IWebSocketContractFactory _socketContractFactory;

    public LiveService(
        ICollection<IWebSocketContract> sockets,
        IWebSocketContractFactory socketContractFactory)
    {
        _sockets = sockets;
        _socketContractFactory = socketContractFactory;
    }

    public async Task Accept(WebSocket webSocket, CancellationToken token)
    {
        var contract = _socketContractFactory.Create(webSocket);
        _sockets.Add(contract);
        await contract.Accept(token);
    }
}