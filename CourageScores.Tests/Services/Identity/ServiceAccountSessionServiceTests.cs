using System.Collections;
using System.Diagnostics.CodeAnalysis;
using System.Net;
using CourageScores.Common;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Http;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Identity;

public class ServiceAccountSessionServiceTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<IUserService> _userService = null!;
    private Mock<IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto>> _dataService = null!;
    private Mock<IServiceAccountSessionCleanUpService> _cleanupService = null!;
    private MockRequestCookies _requestCookies = null!;
    private UserDto? _user;
    private DefaultHttpContext _httpContext = null!;

    private ServiceAccountSessionService _service = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _user = null;
        _userService = new Mock<IUserService>();
        _dataService = new Mock<IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto>>();
        _cleanupService = new Mock<IServiceAccountSessionCleanUpService>();
        _requestCookies = new MockRequestCookies();
        var httpContextAccessor = new Mock<IHttpContextAccessor>();
        _service = new ServiceAccountSessionService(_userService.Object, _dataService.Object, httpContextAccessor.Object, _cleanupService.Object);
        _httpContext = new DefaultHttpContext
        {
            Request =
            {
                Cookies = _requestCookies,
            }
        };

        httpContextAccessor.Setup(a => a.HttpContext).Returns(_httpContext);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
    }

    [Test]
    public async Task Get_WhenSessionIdNotFound_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _dataService.Setup(s => s.Get(id, _token)).ReturnsAsync(() => null);
        _user = new UserDto
        {
            Access = new AccessDto
            {
                LoginServiceAccounts = true,
            }
        };

        var result = await _service.Get(id, _token);

        _cleanupService.Verify(s => s.DeleteExpiredSessions(_token));
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Get_WhenRemoteIpDifferentAndSessionIdFoundAndPermittedToLoginServiceAccounts_ReturnsServiceSession()
    {
        var session = SessionDto();
        var ipAddress = IPAddress.Parse("4.5.6.7");
        var cookieValue = session.CookieValue;
        _dataService.Setup(s => s.Get(session.Id, _token)).ReturnsAsync(session);
        _requestCookies.Cookies[ServiceAccountSessionDto.RequestedSessionCookieValueCookieName] = cookieValue;
        _httpContext.Connection.RemoteIpAddress = ipAddress;
        _user = new UserDto
        {
            Access = new AccessDto
            {
                LoginServiceAccounts = true,
            }
        };

        var result = await _service.Get(session.Id, _token);

        _cleanupService.Verify(s => s.DeleteExpiredSessions(_token));
        Assert.That(result, Is.EqualTo(session));
    }

    [Test]
    public async Task Get_WhenLoggedOutAndSessionIdFoundAndRemoteIpDifferent_ReturnsNull()
    {
        var session = SessionDto();
        var ipAddress = IPAddress.Parse("4.5.6.7");
        var cookieValue = session.CookieValue;
        _dataService.Setup(s => s.Get(session.Id, _token)).ReturnsAsync(session);
        _requestCookies.Cookies[ServiceAccountSessionDto.RequestedSessionCookieValueCookieName] = cookieValue;
        _httpContext.Connection.RemoteIpAddress = ipAddress;

        var result = await _service.Get(session.Id, _token);

        _cleanupService.Verify(s => s.DeleteExpiredSessions(_token));
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Get_WhenLoggedOutAndSessionIdFoundAndCookieNotFound_ReturnsNull()
    {
        var session = SessionDto();
        var ipAddress = IPAddress.Parse(session.ServiceIpAddress);
        _dataService.Setup(s => s.Get(session.Id, _token)).ReturnsAsync(session);
        _httpContext.Connection.RemoteIpAddress = ipAddress;

        var result = await _service.Get(session.Id, _token);

        _cleanupService.Verify(s => s.DeleteExpiredSessions(_token));
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Get_WhenLoggedOutAndSessionIdFoundAndCookieMismatches_ReturnsNull()
    {
        var session = SessionDto();
        var ipAddress = IPAddress.Parse(session.ServiceIpAddress);
        var cookieValue = "different cookie value";
        _dataService.Setup(s => s.Get(session.Id, _token)).ReturnsAsync(session);
        _requestCookies.Cookies[ServiceAccountSessionDto.RequestedSessionCookieValueCookieName] = cookieValue;
        _httpContext.Connection.RemoteIpAddress = ipAddress;

        var result = await _service.Get(session.Id, _token);

        _cleanupService.Verify(s => s.DeleteExpiredSessions(_token));
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Get_WhenLoggedOutAndSessionIdFoundAndCookieMatches_ReturnsSession()
    {
        var session = SessionDto();
        var ipAddress = IPAddress.Parse(session.ServiceIpAddress);
        var cookieValue = session.CookieValue;
        _dataService.Setup(s => s.Get(session.Id, _token)).ReturnsAsync(session);
        _requestCookies.Cookies[ServiceAccountSessionDto.RequestedSessionCookieValueCookieName] = cookieValue;
        _httpContext.Connection.RemoteIpAddress = ipAddress;

        var result = await _service.Get(session.Id, _token);

        _cleanupService.Verify(s => s.DeleteExpiredSessions(_token));
        Assert.That(result, Is.EqualTo(session));
    }

    [Test]
    public async Task GetAll_WhenLoggedOut_ReturnsEmpty()
    {
        var session = SessionDto();
        _dataService
            .Setup(s => s.GetAll(_token))
            .Returns(TestUtilities.AsyncEnumerable(session));

        var sessions = await _service.GetAll(_token).ToList();

        _dataService.Verify(s => s.GetAll(_token), Times.Never);
        _cleanupService.Verify(s => s.DeleteExpiredSessions(_token));
        Assert.That(sessions, Is.Empty);
    }

    [Test]
    public async Task GetAll_WhenNotPermitted_ReturnsEmpty()
    {
        _user = new UserDto
        {
            Access = new AccessDto { LoginServiceAccounts = false },
        };
        var session = SessionDto();
        _dataService
            .Setup(s => s.GetAll(_token))
            .Returns(TestUtilities.AsyncEnumerable(session));

        var sessions = await _service.GetAll(_token).ToList();

        _dataService.Verify(s => s.GetAll(_token), Times.Never);
        _cleanupService.Verify(s => s.DeleteExpiredSessions(_token));
        Assert.That(sessions, Is.Empty);
    }

    [Test]
    public async Task GetAll_WhenPermitted_ReturnsAllSessions()
    {
        _user = new UserDto
        {
            Access = new AccessDto { LoginServiceAccounts = true },
        };
        var session = SessionDto();
        _dataService
            .Setup(s => s.GetAll(_token))
            .Returns(TestUtilities.AsyncEnumerable(session));

        var sessions = await _service.GetAll(_token).ToList();

        _dataService.Verify(s => s.GetAll(_token));
        _cleanupService.Verify(s => s.DeleteExpiredSessions(_token));
        Assert.That(sessions, Is.EquivalentTo([session]));
    }

    [Test]
    public async Task GetWhere_Throws()
    {
        await Assert.ThatAsync(
            () => _service.GetWhere("some query", _token).ToList(),
            Throws.TypeOf<NotSupportedException>());
        _dataService.Verify(s => s.GetWhere(It.IsAny<string>(), _token), Times.Never);
    }

    [Test]
    public async Task Upsert_WhenLoggedOut_CallsUnderlyingService()
    {
        var id = Guid.NewGuid();
        var command = new Mock<IUpdateCommand<ServiceAccountSession, ServiceAccountSessionDto>>();

        await _service.Upsert(id, command.Object, _token);

        _dataService.Verify(s => s.Upsert(id, command.Object, _token));
        _cleanupService.Verify(s => s.DeleteExpiredSessions(_token));
    }

    [Test]
    public async Task Upsert_WhenLoggedIn_CallsUnderlyingService()
    {
        var id = Guid.NewGuid();
        var command = new Mock<IUpdateCommand<ServiceAccountSession, ServiceAccountSessionDto>>();
        _user = new UserDto();

        await _service.Upsert(id, command.Object, _token);

        _dataService.Verify(s => s.Upsert(id, command.Object, _token));
        _cleanupService.Verify(s => s.DeleteExpiredSessions(_token));
    }

    [Test]
    public async Task Delete_Throws()
    {
        await Assert.ThatAsync(
            () => _service.Delete(Guid.NewGuid(), _token),
            Throws.TypeOf<NotSupportedException>());
        _dataService.Verify(s => s.Delete(It.IsAny<Guid>(), _token), Times.Never);
    }

    [Test]
    public async Task SignOutAsync_WhenNoActivatedCookieFound_ReturnsFalse()
    {
        var result = await _service.SignOutAsync(_token);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task SignOutAsync_WhenActivatedCookieFoundWithNonGuidValue_RemovesCookieAndReturnsTrue()
    {
        _requestCookies.Cookies[ServiceAccountSessionDto.ActivatedSessionIdCookieName] = "not a guid";

        var result = await _service.SignOutAsync(_token);

        Assert.That(result, Is.True);
        var responseCookieHeaders = _httpContext.Response.Headers.SetCookie;
        Assert.That(responseCookieHeaders.Select(h => h), Has.Some.StartsWith($"{ServiceAccountSessionDto.ActivatedSessionIdCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT"));
    }

    [Test]
    public async Task SignOutAsync_WhenActivatedCookieFoundWithGuidValue_DeletesSessionRemovesCookieAndReturnsTrue()
    {
        var activatedId = Guid.NewGuid();
        _requestCookies.Cookies[ServiceAccountSessionDto.ActivatedSessionIdCookieName] = activatedId.ToString();

        var result = await _service.SignOutAsync(_token);

        _dataService.Verify(s => s.Delete(activatedId, _token));
        Assert.That(result, Is.True);
        var responseCookieHeaders = _httpContext.Response.Headers.SetCookie;
        Assert.That(responseCookieHeaders.Select(h => h), Has.Some.StartsWith($"{ServiceAccountSessionDto.ActivatedSessionIdCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT"));
    }

    [Test]
    public async Task SignOutAsync_WhenLinkedSessionCookieFound_DeletesCookie()
    {
        _requestCookies.Cookies[ServiceAccountSessionDto.RequestedSessionCookieValueCookieName] = "anything";

        var result = await _service.SignOutAsync(_token);

        Assert.That(result, Is.False);
        var responseCookieHeaders = _httpContext.Response.Headers.SetCookie;
        Assert.That(responseCookieHeaders.Select(h => h), Has.Some.StartsWith($"{ServiceAccountSessionDto.RequestedSessionCookieValueCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT"));
    }

    [Test]
    public async Task SignOutAsync_WhenLinkedSessionCookieNotFound_DoesNotDeleteCookie()
    {
        var result = await _service.SignOutAsync(_token);

        Assert.That(result, Is.False);
        var responseCookieHeaders = _httpContext.Response.Headers.SetCookie;
        Assert.That(responseCookieHeaders.Select(h => h), Is.Empty);
    }

    private static ServiceAccountSessionDto SessionDto()
    {
        return new ServiceAccountSessionDto
        {
            Id = Guid.NewGuid(),
            ServiceIpAddress = "1.2.3.4",
            ServiceUserAgent = "user-agent",
            FriendlyName = "friendly-name",
            CookieValue = "cookie-value",
        };
    }

    private class MockRequestCookies : IRequestCookieCollection
    {
        public Dictionary<string, string> Cookies { get; } = new();

        public IEnumerator<KeyValuePair<string, string>> GetEnumerator()
        {
            return Cookies.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public bool ContainsKey(string key)
        {
            return Cookies.ContainsKey(key);
        }

        public bool TryGetValue(string key, [NotNullWhen(true)] out string? value)
        {
            return Cookies.TryGetValue(key, out value);
        }

        public int Count => Cookies.Count;
        public ICollection<string> Keys => Cookies.Keys;

        public string this[string key] => Cookies[key];
    }
}
