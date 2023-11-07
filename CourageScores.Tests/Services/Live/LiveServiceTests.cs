using System.Net.WebSockets;
using CourageScores.Services.Live;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Live;

[TestFixture]
public class LiveServiceTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<ICollection<IWebSocketContract>> _sockets = null!;
    private Mock<IWebSocketContractFactory> _contractFactory = null!;
    private Mock<IWebSocketContract> _contract = null!;
    private LiveService _service = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _sockets = new Mock<ICollection<IWebSocketContract>>();
        _contractFactory = new Mock<IWebSocketContractFactory>();
        _service = new LiveService(_sockets.Object, _contractFactory.Object);
        _contract = new Mock<IWebSocketContract>();

        _contractFactory
            .Setup(f => f.Create(It.IsAny<WebSocket>(), It.IsAny<string>(), _token))
            .ReturnsAsync(() => _contract.Object);
    }

    [Test]
    public async Task Accept_WhenCalled_AddsWebSocket()
    {
        var socket = new Mock<WebSocket>();

        await _service.Accept(socket.Object, "originatingUrl", _token);

        _sockets.Verify(s => s.Add(It.IsAny<IWebSocketContract>()));
    }

    [Test]
    public async Task Accept_WhenCalled_AcceptsTheContract()
    {
        var socket = new Mock<WebSocket>();

        await _service.Accept(socket.Object, "originatingUrl", _token);

        _contractFactory.Verify(f => f.Create(socket.Object, "originatingUrl", _token));
        _contract.Verify(s => s.Accept(_token));
    }
}