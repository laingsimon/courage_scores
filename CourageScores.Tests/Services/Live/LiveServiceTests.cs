using System.Net.WebSockets;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Live;
using CourageScores.Services.Identity;
using CourageScores.Services.Live;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Live;

[TestFixture]
public class LiveServiceTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private List<IWebSocketContract> _sockets = null!;
    private Mock<IWebSocketContractFactory> _contractFactory = null!;
    private Mock<IWebSocketContract> _contract = null!;
    private LiveService _service = null!;
    private Mock<IUserService> _userService = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _sockets = new List<IWebSocketContract>();
        _contractFactory = new Mock<IWebSocketContractFactory>();
        _userService = new Mock<IUserService>();
        _service = new LiveService(_sockets, _contractFactory.Object, _userService.Object);
        _contract = new Mock<IWebSocketContract>();

        _contractFactory
            .Setup(f => f.Create(It.IsAny<WebSocket>(), It.IsAny<string>(), _token))
            .ReturnsAsync(() => _contract.Object);
        _userService
            .Setup(s => s.GetUser(_token))
            .ReturnsAsync(() => _user);
    }

    [Test]
    public async Task Accept_WhenCalled_AddsWebSocket()
    {
        var socket = new Mock<WebSocket>();

        await _service.Accept(socket.Object, "originatingUrl", _token);

        Assert.That(_sockets.Count, Is.EqualTo(1));
    }

    [Test]
    public async Task Accept_WhenCalled_AcceptsTheContract()
    {
        var socket = new Mock<WebSocket>();

        await _service.Accept(socket.Object, "originatingUrl", _token);

        _contractFactory.Verify(f => f.Create(socket.Object, "originatingUrl", _token));
        _contract.Verify(s => s.Accept(_token));
    }

    [Test]
    public async Task GetSockets_WhenLoggedOut_ReturnsNotLoggedIn()
    {
        _user = null;

        var result = await _service.GetSockets(_token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Not logged in" }));
    }

    [Test]
    public async Task GetSockets_WhenNotPermitted_ReturnsNotPermitted()
    {
        _user = new UserDto
        {
            Access = new AccessDto(),
        };

        var result = await _service.GetSockets(_token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task GetSockets_WhenPermitted_ReturnsSockets()
    {
        var socketDto = new WebSocketDto();
        var socket = new Mock<IWebSocketContract>();
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageSockets = true,
            },
        };
        _sockets.Add(socket.Object);
        socket.Setup(s => s.WebSocketDto).Returns(socketDto);

        var result = await _service.GetSockets(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.EquivalentTo(new[] { socketDto }));
    }

    [Test]
    public async Task CloseSocket_WhenLoggedOut_ReturnsNotLoggedIn()
    {
        _user = null;
        var socketDto = new WebSocketDto
        {
            Id = Guid.NewGuid(),
        };
        var socket = new Mock<IWebSocketContract>();
        _sockets.Add(socket.Object);
        socket.Setup(s => s.WebSocketDto).Returns(socketDto);

        var result = await _service.CloseSocket(socketDto.Id, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Not logged in" }));
    }

    [Test]
    public async Task CloseSocket_WhenNotPermitted_ReturnsNotPermitted()
    {
        _user = new UserDto
        {
            Access = new AccessDto(),
        };
        var socketDto = new WebSocketDto
        {
            Id = Guid.NewGuid(),
        };
        var socket = new Mock<IWebSocketContract>();
        _sockets.Add(socket.Object);
        socket.Setup(s => s.WebSocketDto).Returns(socketDto);

        var result = await _service.CloseSocket(socketDto.Id, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task CloseSocket_WhenPermittedAndSocketNotFound_ReturnsNotFound()
    {
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageSockets = true,
            },
        };
        var socketDto = new WebSocketDto
        {
            Id = Guid.NewGuid(),
        };
        var socket = new Mock<IWebSocketContract>();
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageSockets = true,
            },
        };
        _sockets.Add(socket.Object);
        socket.Setup(s => s.WebSocketDto).Returns(socketDto);

        var result = await _service.CloseSocket(Guid.NewGuid(), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Not found" }));
    }

    [Test]
    public async Task CloseSocket_WhenPermitted_ClosesSocket()
    {
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageSockets = true,
            },
        };
        var socketDto = new WebSocketDto
        {
            Id = Guid.NewGuid(),
        };
        var socket = new Mock<IWebSocketContract>();
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageSockets = true,
            },
        };
        _sockets.Add(socket.Object);
        socket.Setup(s => s.WebSocketDto).Returns(socketDto);

        var result = await _service.CloseSocket(socketDto.Id, _token);

        socket.Verify(s => s.Close(_token));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Socket closed" }));
        Assert.That(result.Result, Is.EqualTo(socketDto));
    }
}