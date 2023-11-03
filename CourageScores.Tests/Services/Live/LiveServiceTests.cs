using System.Net.WebSockets;
using CourageScores.Services.Live;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Live;

[TestFixture]
public class LiveServiceTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<IGroupedCollection<IWebSocketContract>> _sockets = null!;
    private Mock<IWebSocketContractFactory> _contractFactory = null!;
    private Mock<IWebSocketContract> _contract = null!;
    private LiveService _service = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _sockets = new Mock<IGroupedCollection<IWebSocketContract>>();
        _contractFactory = new Mock<IWebSocketContractFactory>();
        _service = new LiveService(_sockets.Object, _contractFactory.Object);
        _contract = new Mock<IWebSocketContract>();

        _contractFactory.Setup(f => f.Create(It.IsAny<WebSocket>(), It.IsAny<Guid>())).Returns(_contract.Object);
    }

    [Test]
    public async Task Accept_WhenCalled_AddsWebSocket()
    {
        var key = Guid.NewGuid();
        var socket = new Mock<WebSocket>();

        await _service.Accept(socket.Object, key, _token);

        _sockets.Verify(s => s.Add(key, It.IsAny<IWebSocketContract>()));
    }

    [Test]
    public async Task Accept_WhenCalled_AcceptsTheContract()
    {
        var key = Guid.NewGuid();
        var socket = new Mock<WebSocket>();

        await _service.Accept(socket.Object, key, _token);

        _contractFactory.Verify(f => f.Create(socket.Object, key));
        _contract.Verify(s => s.Accept(_token));
    }
}