using System.Net.WebSockets;

namespace CourageScores.Services.Live;

public class LiveService : ILiveService
{
    private readonly IGroupedCollection<IWebSocketContract> _sockets;
    private readonly IWebSocketContractFactory _socketContractFactory;

    public LiveService(
        IGroupedCollection<IWebSocketContract> sockets,
        IWebSocketContractFactory socketContractFactory)
    {
        _sockets = sockets;
        _socketContractFactory = socketContractFactory;
    }

    public async Task Accept(WebSocket webSocket, Guid key, CancellationToken token)
    {
        var contract = _socketContractFactory.Create(webSocket, key);
        _sockets.Add(key, contract);
        await contract.Accept(token);
    }
}