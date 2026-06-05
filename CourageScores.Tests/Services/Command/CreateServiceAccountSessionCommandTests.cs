using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Http;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

public class CreateServiceAccountSessionCommandTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<IUserService> _userService = null!;
    private Mock<IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto>> _service = null!;
    private DefaultHttpContext _httpContext = null!;
    private CreateServiceAccountSessionDto _request = null!;
    private ServiceAccountSession _existingSession = null!;
    private UserDto? _user;
    private Mock<IRequestCookieCollection> _requestCookies = null!;

    private CreateServiceAccountSessionCommand _command = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var httpContextAccessor = new Mock<IHttpContextAccessor>();
        _userService = new Mock<IUserService>();
        _service = new Mock<IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto>>();
        _requestCookies = new Mock<IRequestCookieCollection>();
        _httpContext = new DefaultHttpContext
        {
            Request =
            {
                Cookies = _requestCookies.Object,
            },
        };
        _command = new CreateServiceAccountSessionCommand(_userService.Object, httpContextAccessor.Object, _service.Object);
        _request = new CreateServiceAccountSessionDto
        {
            PinHash = "request-pin-hash",
        };
        _existingSession = new ServiceAccountSession
        {
            Id = Guid.NewGuid(),
            ServiceIpAddress = "existing-ip-address",
            ServiceUserAgent = "existing-user-agent",
            PinHash = "existing-pin-hash",
            CookieValue = "existing-cookie",
        };
        _user = null;

        _userService.Setup(u => u.GetUser(_token)).ReturnsAsync(() => _user);
        httpContextAccessor.Setup(x => x.HttpContext).Returns(_httpContext);
    }

    [Test]
    public async Task ApplyUpdates_WhenLoggedIn_ReturnsNotPermittedWhenLoggedIn()
    {
        _user = new UserDto
        {
            Access = new AccessDto(),
        };

        var result = await _command.WithRequest(_request).ApplyUpdate(_existingSession, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Cannot create a session when logged in"]));
    }

    [Test]
    public async Task ApplyUpdates_WhenPinHashIsEmpty_ReturnPinHashMissing()
    {
        _request.PinHash = "";

        var result = await _command.WithRequest(_request).ApplyUpdate(_existingSession, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Pin hash is missing"]));
    }

    [Test]
    public async Task ApplyUpdates_WhenCookiePresentAndExistingSessionFound_DeletesExistingSessionAndReturnsNewSession()
    {
        var newModel = Session();
        var cookieValue = _existingSession.CookieValue;
        _requestCookies
            .Setup(c => c.TryGetValue(ServiceAccountSessionDto.CookieName, out cookieValue))
            .Returns(true);
        var existingSession = SessionDto();
        _service
            .Setup(s => s.GetWhere($"t.{nameof(newModel.CookieValue)} = '{cookieValue}'", _token))
            .Returns(TestUtilities.AsyncEnumerable(existingSession));

        var result = await _command.WithRequest(_request).ApplyUpdate(newModel, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(["Session created"]));
        _service.Verify(s => s.Delete(existingSession.Id, _token));
    }

    [Test]
    public async Task ApplyUpdates_WhenCookiePresentAndExistingSessionNotFound_ReturnsNewSessionAndDeletesCookie()
    {
        var newModel = Session();
        var cookieValue = _existingSession.CookieValue;
        _requestCookies
            .Setup(c => c.TryGetValue(ServiceAccountSessionDto.CookieName, out cookieValue))
            .Returns(true);
        _service
            .Setup(s => s.GetWhere($"t.{nameof(newModel.CookieValue)} = '{cookieValue}'", _token))
            .Returns(TestUtilities.AsyncEnumerable<ServiceAccountSessionDto>());

        var result = await _command.WithRequest(_request).ApplyUpdate(newModel, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(["Session created"]));
        _service.Verify(s => s.Delete(It.IsAny<Guid>(), _token), Times.Never);
    }

    [Test]
    public async Task ApplyUpdates_WhenCookieNotPresent_ReturnsNewSession()
    {
        var newModel = Session();
        var cookieValue = "not present";
        _requestCookies
            .Setup(c => c.TryGetValue(ServiceAccountSessionDto.CookieName, out cookieValue))
            .Returns(false);

        var result = await _command.WithRequest(_request).ApplyUpdate(newModel, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(["Session created"]));
        _service.Verify(s => s.GetWhere(It.IsAny<string>(), _token), Times.Never);
        // _httpContext.Response.Cookies
    }

    private static ServiceAccountSession Session()
    {
        return new ServiceAccountSession
        {
            Id = Guid.NewGuid(),
            PinHash = "",
            ServiceIpAddress = "",
            ServiceUserAgent = "",
            CookieValue = "",
        };
    }

    private static ServiceAccountSessionDto SessionDto()
    {
        return new ServiceAccountSessionDto
        {
            Id = Guid.NewGuid(),
            PinHash = "",
            ServiceIpAddress = "",
            ServiceUserAgent = "",
            CookieValue = "",
        };
    }
}
