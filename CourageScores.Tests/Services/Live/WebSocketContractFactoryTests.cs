using System.Net.WebSockets;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CourageScores.Services.Live;
using Microsoft.AspNetCore.Authentication;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Live;

[TestFixture]
public class WebSocketContractFactoryTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<IUserService> _userService = null!;
    private Mock<IJsonSerializerService> _serializerService = null!;
    private Mock<IWebSocketMessageProcessor> _processor = null!;
    private Mock<ISystemClock> _clock = null!;
    private Mock<WebSocket> _webSocket = null!;
    private WebSocketContractFactory _factory = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _serializerService = new Mock<IJsonSerializerService>();
        _processor = new Mock<IWebSocketMessageProcessor>();
        _clock = new Mock<ISystemClock>();
        _user = new UserDto
        {
            Name = "USER",
        };
        _webSocket = new Mock<WebSocket>();

        _factory = new WebSocketContractFactory(_serializerService.Object, _processor.Object, _clock.Object, _userService.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
    }

    [Test]
    public async Task Create_WhenLoggedOut_SetsUserNameToNull()
    {
        _user = null;

        var result = await _factory.Create(_webSocket.Object, "originatingUrl", _token);

        Assert.That(result.WebSocketDto.UserName, Is.Null);
    }

    [Test]
    public async Task Create_WhenLoggedIn_SetsUserNameCorrectly()
    {
        var result = await _factory.Create(_webSocket.Object, "originatingUrl", _token);

        Assert.That(result.WebSocketDto.UserName, Is.EqualTo(_user!.Name));
    }

    [Test]
    public async Task Create_WhenCalled_SetsConnectedTime()
    {
        var now = DateTimeOffset.UtcNow;
        _clock.Setup(c => c.UtcNow).Returns(now);

        var result = await _factory.Create(_webSocket.Object, "originatingUrl", _token);

        Assert.That(result.WebSocketDto.Connected, Is.EqualTo(now));
    }

    [Test]
    public async Task Create_WhenCalled_SetsOriginatingUrl()
    {
        var result = await _factory.Create(_webSocket.Object, "originatingUrl", _token);

        Assert.That(result.WebSocketDto.OriginatingUrl, Is.EqualTo("originatingUrl"));
    }

    [Test]
    public async Task Create_WhenCalled_SetsId()
    {
        var result = await _factory.Create(_webSocket.Object, "originatingUrl", _token);

        Assert.That(result.WebSocketDto.Id, Is.Not.EqualTo(Guid.Empty));
    }
}