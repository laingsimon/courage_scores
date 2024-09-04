using System.Net.WebSockets;
using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Live;
using CourageScores.Models.Live;
using CourageScores.Services;
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
    private Mock<IUpdatedDataSource> _updatedDataSource = null!;
    private Mock<IWebSocketMessageProcessor> _webSocketMessageProcessor = null!;
    private Mock<ISimpleOnewayAdapter<WebSocketDetail, WebSocketDto>> _detailsAdapter = null!;
    private Mock<ISimpleOnewayAdapter<WatchableData, WatchableDataDto>> _watchableAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _sockets = new List<IWebSocketContract>();
        _contractFactory = new Mock<IWebSocketContractFactory>();
        _userService = new Mock<IUserService>();
        _updatedDataSource = new Mock<IUpdatedDataSource>();
        _webSocketMessageProcessor = new Mock<IWebSocketMessageProcessor>();
        _detailsAdapter = new Mock<ISimpleOnewayAdapter<WebSocketDetail, WebSocketDto>>();
        _watchableAdapter = new Mock<ISimpleOnewayAdapter<WatchableData, WatchableDataDto>>();
        _service = new LiveService(
            _sockets,
            _contractFactory.Object,
            _userService.Object,
            _updatedDataSource.Object,
            _webSocketMessageProcessor.Object,
            _detailsAdapter.Object,
            _watchableAdapter.Object);
        _contract = new Mock<IWebSocketContract>();

        _contractFactory
            .Setup(f => f.Create(It.IsAny<WebSocket>(), It.IsAny<string>(), _token))
            .ReturnsAsync(() => _contract.Object);
        _userService
            .Setup(s => s.GetUser(_token))
            .ReturnsAsync(() => _user);
    }

    [Test]
    public async Task Accept_WhenLoggedOut_DoesNotAddWebSocket()
    {
        var socket = new Mock<WebSocket>();
        _user = null;

        await _service.Accept(socket.Object, "originatingUrl", _token);

        Assert.That(_sockets.Count, Is.EqualTo(0));
    }

    [Test]
    public async Task Accept_WhenNotPermitted_DoesNotAddWebSocket()
    {
        var socket = new Mock<WebSocket>();
        _user = _user.SetAccess();

        await _service.Accept(socket.Object, "originatingUrl", _token);

        Assert.That(_sockets.Count, Is.EqualTo(0));
    }

    [Test]
    public async Task Accept_WhenPermitted_AddsWebSocket()
    {
        var socket = new Mock<WebSocket>();
        _user = _user.SetAccess(useWebSockets: true);

        await _service.Accept(socket.Object, "originatingUrl", _token);

        Assert.That(_sockets.Count, Is.EqualTo(1));
    }

    [Test]
    public async Task Accept_WhenPermitted_AcceptsTheContract()
    {
        var socket = new Mock<WebSocket>();
        _user = _user.SetAccess(useWebSockets: true);

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
        _user = _user.SetAccess();

        var result = await _service.GetSockets(_token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task GetSockets_WhenPermitted_ReturnsSockets()
    {
        var socketDto = new WebSocketDto();
        var details = new WebSocketDetail();
        var socket = new Mock<IWebSocketContract>();
        _user = _user.SetAccess(manageSockets: true);
        _sockets.Add(socket.Object);
        _detailsAdapter.Setup(a => a.Adapt(details, _token)).ReturnsAsync(socketDto);
        socket.Setup(s => s.Details).Returns(details);

        var result = await _service.GetSockets(_token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.EquivalentTo(new[] { socketDto }));
    }

    [Test]
    public async Task CloseSocket_WhenLoggedOut_ReturnsNotLoggedIn()
    {
        _user = null;
        var details = new WebSocketDetail
        {
            Id = Guid.NewGuid(),
        };
        var socketDto = new WebSocketDto
        {
            Id = details.Id,
        };
        var socket = new Mock<IWebSocketContract>();
        _sockets.Add(socket.Object);
        _detailsAdapter.Setup(a => a.Adapt(details, _token)).ReturnsAsync(socketDto);
        socket.Setup(s => s.Details).Returns(details);

        var result = await _service.CloseSocket(socketDto.Id, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Not logged in" }));
    }

    [Test]
    public async Task CloseSocket_WhenNotPermitted_ReturnsNotPermitted()
    {
        _user = _user.SetAccess();
        var details = new WebSocketDetail
        {
            Id = Guid.NewGuid(),
        };
        var socketDto = new WebSocketDto
        {
            Id = details.Id,
        };
        var socket = new Mock<IWebSocketContract>();
        _sockets.Add(socket.Object);
        _detailsAdapter.Setup(a => a.Adapt(details, _token)).ReturnsAsync(socketDto);
        socket.Setup(s => s.Details).Returns(details);

        var result = await _service.CloseSocket(socketDto.Id, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task CloseSocket_WhenPermittedAndSocketNotFound_ReturnsNotFound()
    {
        _user = _user.SetAccess(manageSockets: true);
        var details = new WebSocketDetail
        {
            Id = Guid.NewGuid(),
        };
        var socketDto = new WebSocketDto
        {
            Id = details.Id,
        };
        var socket = new Mock<IWebSocketContract>();
        _sockets.Add(socket.Object);
        _detailsAdapter.Setup(a => a.Adapt(details, _token)).ReturnsAsync(socketDto);
        socket.Setup(s => s.Details).Returns(details);

        var result = await _service.CloseSocket(Guid.NewGuid(), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Not found" }));
    }

    [Test]
    public async Task CloseSocket_WhenPermitted_ClosesSocket()
    {
        _user = _user.SetAccess(manageSockets: true);
        var details = new WebSocketDetail
        {
            Id = Guid.NewGuid(),
        };
        var socketDto = new WebSocketDto
        {
            Id = details.Id,
        };
        var socket = new Mock<IWebSocketContract>();
        _sockets.Add(socket.Object);
        _detailsAdapter.Setup(a => a.Adapt(details, _token)).ReturnsAsync(socketDto);
        socket.Setup(s => s.Details).Returns(details);

        var result = await _service.CloseSocket(socketDto.Id, _token);

        socket.Verify(s => s.Close(_token));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Socket closed" }));
        Assert.That(result.Result, Is.EqualTo(socketDto));
    }

    [Test]
    public async Task GetUpdate_WhenEntityNotTracked_ReturnsError()
    {
        var id = Guid.NewGuid();
        var since = DateTimeOffset.UtcNow;
        _updatedDataSource.Setup(s => s.GetUpdate(id, LiveDataType.Sayg, since)).ReturnsAsync(() => null);

        var result = await _service.GetUpdate(id, LiveDataType.Sayg, since, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task GetUpdate_WhenEntityNotUpdated_ReturnsNotUpdatedWithLastUpdateDate()
    {
        var id = Guid.NewGuid();
        var since = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var lastUpdated = new DateTimeOffset(2001, 02, 03, 05, 06, 07, TimeSpan.Zero);
        var updatedData = new PollingUpdatesProcessor.UpdateData(LiveDataType.Sayg, id, null, lastUpdated, "userName");
        _updatedDataSource.Setup(s => s.GetUpdate(id, LiveDataType.Sayg, since)).ReturnsAsync(updatedData);

        var result = await _service.GetUpdate(id, LiveDataType.Sayg, since, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.LastUpdate, Is.EqualTo(lastUpdated));
        Assert.That(result.Result.Data, Is.Null);
    }

    [Test]
    public async Task GetUpdate_WhenEntityUpdated_ReturnsUpdatedDataAndLastUpdateDate()
    {
        var id = Guid.NewGuid();
        var since = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var lastUpdated = new DateTimeOffset(2001, 02, 03, 05, 06, 07, TimeSpan.Zero);
        var updatedData = new PollingUpdatesProcessor.UpdateData(LiveDataType.Sayg, id, "data", lastUpdated, "userName");
        _updatedDataSource.Setup(s => s.GetUpdate(id, LiveDataType.Sayg, since)).ReturnsAsync(updatedData);

        var result = await _service.GetUpdate(id, LiveDataType.Sayg, since, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Data, Is.EqualTo("data"));
        Assert.That(result.Result.LastUpdate, Is.EqualTo(lastUpdated));
    }

    [Test]
    public async Task ProcessUpdate_WhenCalled_PublishesUpdate()
    {
        var id = Guid.NewGuid();

        await _service.ProcessUpdate(id, LiveDataType.Sayg, "DATA", _token);

        _webSocketMessageProcessor.Verify(p => p.PublishUpdate(It.IsAny<IWebSocketContract>(), id, LiveDataType.Sayg, "DATA", _token));
    }

    [Test]
    public async Task GetWatchableData_GivenNoLiveDataType_GetsDtosForAllSockets()
    {
        var sayg = new WatchableData(new WebSocketDetail(), new WebSocketPublication
        {
            Id = Guid.NewGuid(),
        }, PublicationMode.WebSocket);
        var tournament = new WatchableData(new WebSocketDetail(), new WebSocketPublication
        {
            Id = Guid.NewGuid(),
        }, PublicationMode.WebSocket);
        var lookup = new Dictionary<Guid, LiveDataType>
        {
            { sayg.Publication.Id, LiveDataType.Sayg },
            { tournament.Publication.Id, LiveDataType.Tournament },
        };
        _webSocketMessageProcessor
            .Setup(p => p.GetWatchableData(_token))
            .Returns(TestUtilities.AsyncEnumerable(sayg, tournament));
        _watchableAdapter
            .Setup(a => a.Adapt(It.IsAny<WatchableData>(), _token))
            .ReturnsAsync((WatchableData data, CancellationToken _) => new WatchableDataDto { DataType = lookup[data.Publication.Id], Id = data.Publication.Id });

        var dtos = await _service.GetWatchableData(null, _token).ToList();

        _watchableAdapter.Verify(a => a.Adapt(sayg, _token));
        _watchableAdapter.Verify(a => a.Adapt(tournament, _token));
        Assert.That(dtos.Select(d => d.Id), Is.EquivalentTo(new[] { tournament.Publication.Id, sayg.Publication.Id }));
    }

    [Test]
    public async Task GetWatchableData_GivenLiveDataType_GetsDtosForDataType()
    {
        var sayg = new WatchableData(new WebSocketDetail(), new WebSocketPublication
        {
            Id = Guid.NewGuid(),
        }, PublicationMode.WebSocket);
        var tournament = new WatchableData(new WebSocketDetail(), new WebSocketPublication
        {
            Id = Guid.NewGuid(),
        }, PublicationMode.WebSocket);
        var lookup = new Dictionary<Guid, LiveDataType>
        {
            { sayg.Publication.Id, LiveDataType.Sayg },
            { tournament.Publication.Id, LiveDataType.Tournament },
        };
        _webSocketMessageProcessor
            .Setup(p => p.GetWatchableData(_token))
            .Returns(TestUtilities.AsyncEnumerable(sayg, tournament));
        _watchableAdapter
            .Setup(a => a.Adapt(It.IsAny<WatchableData>(), _token))
            .ReturnsAsync((WatchableData data, CancellationToken _) => new WatchableDataDto { DataType = lookup[data.Publication.Id], Id = data.Publication.Id });

        var dtos = await _service.GetWatchableData(LiveDataType.Sayg, _token).ToList();

        _watchableAdapter.Verify(a => a.Adapt(sayg, _token));
        _watchableAdapter.Verify(a => a.Adapt(tournament, _token));
        Assert.That(dtos.Select(d => d.Id), Is.EquivalentTo(new[] { sayg.Publication.Id }));
    }

    [Test]
    public async Task GetWatchableData_WhenWatchableViaMultipleProcessors_ReturnsWebSocketOnly()
    {
        var webSocket = new WatchableData(new WebSocketDetail(), new WebSocketPublication
        {
            Id = Guid.NewGuid(),
        }, PublicationMode.WebSocket);
        var polling = new WatchableData(new WebSocketDetail(), new WebSocketPublication
        {
            Id = webSocket.Publication.Id,
        }, PublicationMode.Polling);
        var lookup = new Dictionary<Guid, LiveDataType>
        {
            { webSocket.Publication.Id, LiveDataType.Sayg },
        };
        _webSocketMessageProcessor
            .Setup(p => p.GetWatchableData(_token))
            .Returns(TestUtilities.AsyncEnumerable(polling, webSocket));
        _watchableAdapter
            .Setup(a => a.Adapt(It.IsAny<WatchableData>(), _token))
            .ReturnsAsync((WatchableData data, CancellationToken _) => new WatchableDataDto { DataType = lookup[data.Publication.Id], Id = data.Publication.Id });

        var dtos = await _service.GetWatchableData(LiveDataType.Sayg, _token).ToList();

        _watchableAdapter.Verify(a => a.Adapt(webSocket, _token));
        _watchableAdapter.Verify(a => a.Adapt(polling, _token));
        Assert.That(dtos.Select(d => d.Id), Is.EquivalentTo(new[] { webSocket.Publication.Id }));
    }
}