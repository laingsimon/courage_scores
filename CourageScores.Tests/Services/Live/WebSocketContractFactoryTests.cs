using System.Net.WebSockets;
using AutoFixture;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using CourageScores.Services.Live;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Live;

[TestFixture]
public class WebSocketContractFactoryTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<TimeProvider> _clock = null!;
    private Mock<WebSocket> _webSocket = null!;
    private WebSocketContractFactory _factory = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        var userService = fixture.FreezeMock<IUserService>();
        _clock = fixture.FreezeMock<TimeProvider>();
        _user = new UserDto
        {
            Name = "USER",
        };
        _webSocket = fixture.FreezeMock<WebSocket>();

        _factory = fixture.Create<WebSocketContractFactory>();

        userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
    }

    [Test]
    public async Task Create_WhenLoggedOut_SetsUserNameToNull()
    {
        _user = null;

        var result = await _factory.Create(_webSocket.Object, "originatingUrl", _token);

        Assert.That(result.Details.UserName, Is.Null);
    }

    [Test]
    public async Task Create_WhenLoggedIn_SetsUserNameCorrectly()
    {
        var result = await _factory.Create(_webSocket.Object, "originatingUrl", _token);

        Assert.That(result.Details.UserName, Is.EqualTo(_user!.Name));
    }

    [Test]
    public async Task Create_WhenCalled_SetsConnectedTime()
    {
        var now = DateTimeOffset.UtcNow;
        _clock.Setup(c => c.GetUtcNow()).Returns(now);

        var result = await _factory.Create(_webSocket.Object, "originatingUrl", _token);

        Assert.That(result.Details.Connected, Is.EqualTo(now));
    }

    [Test]
    public async Task Create_WhenCalled_SetsOriginatingUrl()
    {
        var result = await _factory.Create(_webSocket.Object, "originatingUrl", _token);

        Assert.That(result.Details.OriginatingUrl, Is.EqualTo("originatingUrl"));
    }

    [Test]
    public async Task Create_WhenCalled_SetsId()
    {
        var result = await _factory.Create(_webSocket.Object, "originatingUrl", _token);

        Assert.That(result.Details.Id, Is.Not.EqualTo(Guid.Empty));
    }
}
