using System.Net;
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

[TestFixture]
public class ActivateServiceAccountSessionCommandTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<IUserService> _userService = null!;
    private DefaultHttpContext _httpContext = null!;
    private ServiceAccountSession _model = null!;
    private Mock<IFeatureService> _featureService = null!;
    private ActivateSessionRequestDto _request = null!;
    private ConfiguredFeatureDto _feature = null!;

    private ActivateServiceAccountSessionCommand _command = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _featureService = new Mock<IFeatureService>();
        _feature = new ConfiguredFeatureDto { ConfiguredValue = "true" };
        var httpAccountAccessor = new Mock<IHttpContextAccessor>();
        _httpContext = new DefaultHttpContext
        {
            Connection =
            {
                RemoteIpAddress = IPAddress.Parse("1.2.3.4"),
            }
        };
        _request = new ActivateSessionRequestDto
        {
            Pin = "pin from service account",
        };
        _command = new ActivateServiceAccountSessionCommand(_userService.Object, httpAccountAccessor.Object, _featureService.Object).WithRequest(_request);
        _model = new ServiceAccountSession
        {
            ServiceIpAddress = _httpContext.Connection.RemoteIpAddress.ToString(),
            CookieValue = "cookie",
            ApprovedBy = "someone",
            ServiceUserAgent = "user-agent",
            TransientUsername = "username",
            PinFromApprover = _request.Pin,
        };

        httpAccountAccessor.Setup(x => x.HttpContext).Returns(_httpContext);
        _featureService.Setup(s => s.Get(FeatureLookup.ServiceAccountSessions, _token)).ReturnsAsync(() => _feature);
    }

    [Test]
    public async Task ApplyUpdate_WhenFeatureFlagIsNotConfigured_ReturnsUnsuccessful()
    {
        _feature.ConfiguredValue = null;

        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Service account sessions are not allowed"]));
    }

    [Test]
    public async Task ApplyUpdate_WhenFeatureFlagIsDisabled_ReturnsUnsuccessful()
    {
        _feature.ConfiguredValue = "false";

        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Service account sessions are not allowed"]));
    }

    [Test]
    public async Task ApplyUpdate_WhenIpAddressIsDifferent_ReturnsUnsuccessful()
    {
        _model.ServiceIpAddress = "different ip";

        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Cannot activate a session from a different location"]));
    }

    [Test]
    public async Task ApplyUpdate_WhenPinIsDifferentToApproverPin_ReturnsUnsuccessful()
    {
        _model.PinFromApprover = "approver pin doesn't match service account pin";

        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Cannot activate a session with an incorrect pin"]));
    }

    [Test]
    public async Task ApplyUpdate_WhenNotApproved_ReturnsUnsuccessful()
    {
        _model.ApprovedBy = null;

        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["The session has not been approved"]));
    }

    [Test]
    public async Task ApplyUpdate_WhenUsernameNotSet_ReturnsUnsuccessful()
    {
        _model.TransientUsername = null;

        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["A user was not created for this session"]));
    }

    [Test]
    public async Task ApplyUpdate_WhenUserNotFound_ReturnsUnsuccessful()
    {
        _userService.Setup(s => s.GetUser(_model.TransientUsername!, _token)).ReturnsAsync(() => null);

        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["The user for this session was not found"]));
    }

    [Test]
    public async Task ApplyUpdate_WhenPinAndIpAddressMatch_ReturnsSuccessful()
    {
        var user = new UserDto();
        _userService.Setup(s => s.GetUser(_model.TransientUsername!, _token)).ReturnsAsync(user);

        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(_model.LastRequest, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(["Session activated"]));
    }
}
