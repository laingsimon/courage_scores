using AutoFixture;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
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
    private Mock<IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto>> _service = null!;
    private DefaultHttpContext _httpContext = null!;
    private ServiceAccountSession _existingSession = null!;
    private UserDto? _user;
    private Mock<IRequestCookieCollection> _requestCookies = null!;
    private ConfiguredFeatureDto _feature = null!;
    private readonly CreateSessionRequestDto _request = new CreateSessionRequestDto
    {
        FriendlyName = "friendly-name",
    };

    private CreateServiceAccountSessionCommand _command = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        var httpContextAccessor = fixture.FreezeMock<IHttpContextAccessor>();
        var userService = fixture.FreezeMock<IUserService>();
        var featureService = fixture.FreezeMock<IFeatureService>();
        _feature = new ConfiguredFeatureDto { ConfiguredValue = "true" };
        _service = fixture.FreezeMock<IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto>>();
        _requestCookies = fixture.FreezeMock<IRequestCookieCollection>();
        _httpContext = new DefaultHttpContext
        {
            Request =
            {
                Cookies = _requestCookies.Object,
            },
        };
        _command = fixture.Create<CreateServiceAccountSessionCommand>().WithRequest(_request);
        _existingSession = new ServiceAccountSession
        {
            Id = Guid.NewGuid(),
            FriendlyName = "friendly-name",
            ServiceIpAddress = "existing-ip-address",
            ServiceUserAgent = "existing-user-agent",
            VerificationValue = "existing-cookie",
        };
        _user = null;

        userService.Setup(u => u.GetUser(_token)).ReturnsAsync(() => _user);
        httpContextAccessor.Setup(x => x.HttpContext).Returns(_httpContext);
        featureService.Setup(s => s.Get(FeatureLookup.ServiceAccountSessions, _token)).ReturnsAsync(() => _feature);
    }

    [Test]
    public async Task ApplyUpdate_WhenFeatureFlagIsNotConfigured_ReturnsUnsuccessful()
    {
        _feature.ConfiguredValue = null;

        var result = await _command.ApplyUpdate(Session(), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Service account sessions are not allowed"]));
    }

    [Test]
    public async Task ApplyUpdate_WhenFeatureFlagIsDisabled_ReturnsUnsuccessful()
    {
        _feature.ConfiguredValue = "false";

        var result = await _command.ApplyUpdate(Session(), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Service account sessions are not allowed"]));
    }

    [Test]
    public async Task ApplyUpdates_WhenLoggedIn_ReturnsNotPermittedWhenLoggedIn()
    {
        _user = new UserDto();

        var result = await _command.ApplyUpdate(_existingSession, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Cannot create a session when logged in"]));
    }

    [Test]
    public async Task ApplyUpdates_WhenCookiePresentAndExistingSessionFound_DeletesExistingSessionAndReturnsNewSession()
    {
        var newModel = Session();
        var cookieValue = _existingSession.VerificationValue;
        _requestCookies
            .Setup(c => c.TryGetValue(ServiceAccountSessionDto.SessionVerificationCookieName, out cookieValue))
            .Returns(true);
        var existingSession = SessionDto();
        _service
            .Setup(s => s.GetWhere($"t.{nameof(newModel.VerificationValue)} = '{cookieValue}'", _token))
            .Returns(TestUtilities.AsyncEnumerable(existingSession));

        var result = await _command.ApplyUpdate(newModel, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(newModel.FriendlyName, Is.EqualTo(_request.FriendlyName));
        Assert.That(result.Messages, Is.EquivalentTo(["Session created"]));
        _service.Verify(s => s.Delete(existingSession.Id, _token));
    }

    [Test]
    public async Task ApplyUpdates_WhenCookiePresentAndExistingSessionNotFound_ReturnsNewSessionAndDeletesCookie()
    {
        var newModel = Session();
        var cookieValue = _existingSession.VerificationValue;
        _requestCookies
            .Setup(c => c.TryGetValue(ServiceAccountSessionDto.SessionVerificationCookieName, out cookieValue))
            .Returns(true);
        _service
            .Setup(s => s.GetWhere($"t.{nameof(newModel.VerificationValue)} = '{cookieValue}'", _token))
            .Returns(TestUtilities.AsyncEnumerable<ServiceAccountSessionDto>());

        var result = await _command.ApplyUpdate(newModel, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(newModel.FriendlyName, Is.EqualTo(_request.FriendlyName));
        Assert.That(result.Messages, Is.EquivalentTo(["Session created"]));
        _service.Verify(s => s.Delete(It.IsAny<Guid>(), _token), Times.Never);
    }

    [Test]
    public async Task ApplyUpdates_WhenCookieNotPresent_ReturnsNewSession()
    {
        var newModel = Session();
        var cookieValue = "not present";
        _requestCookies
            .Setup(c => c.TryGetValue(ServiceAccountSessionDto.SessionVerificationCookieName, out cookieValue))
            .Returns(false);

        var result = await _command.ApplyUpdate(newModel, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(newModel.FriendlyName, Is.EqualTo(_request.FriendlyName));
        Assert.That(result.Messages, Is.EquivalentTo(["Session created"]));
        _service.Verify(s => s.GetWhere(It.IsAny<string>(), _token), Times.Never);
        var setCookieHeaders = _httpContext.Response.Headers.SetCookie;
        Assert.That(setCookieHeaders.Select(h => h), Has.All.StartsWith($"{ServiceAccountSessionDto.SessionVerificationCookieName}={newModel.VerificationValue}"));
    }

    private static ServiceAccountSession Session()
    {
        return new ServiceAccountSession
        {
            Id = Guid.NewGuid(),
            FriendlyName = "",
            ServiceIpAddress = "",
            ServiceUserAgent = "",
            VerificationValue = "",
        };
    }

    private static ServiceAccountSessionDto SessionDto()
    {
        return new ServiceAccountSessionDto
        {
            Id = Guid.NewGuid(),
            FriendlyName = "",
            ServiceIpAddress = "",
            ServiceUserAgent = "",
            VerificationValue = "",
        };
    }
}
