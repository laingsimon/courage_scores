using System.Net;
using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Repository.Identity;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Http;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class ApproveServiceAccountSessionCommandTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<IUserService> _userService = null!;
    private Mock<IUserRepository> _userRepository = null!;
    private UserDto? _user;
    private DefaultHttpContext _httpContext = null!;
    private ServiceAccountSession _model = null!;
    private ApproveServiceAccountSessionDto _request = null!;
    private Mock<IFeatureService> _featureService = null!;
    private ConfiguredFeatureDto _feature = null!;

    private ApproveServiceAccountSessionCommand _command = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _user = new UserDto
        {
            Name = "approver",
            Access = new()
            {
                LoginServiceAccounts = true,
            },
        };
        _featureService = new Mock<IFeatureService>();
        _feature = new ConfiguredFeatureDto { ConfiguredValue = "true" };
        var httpContextAccessor = new Mock<IHttpContextAccessor>();
        _httpContext = new DefaultHttpContext
        {
            Connection =
            {
                RemoteIpAddress = IPAddress.Parse("1.2.3.4"),
            }
        };
        _userService = new Mock<IUserService>();
        _userRepository = new Mock<IUserRepository>();
        _model = new ServiceAccountSession
        {
            Id = Guid.NewGuid(),
            CookieValue = "cookie-value",
            ServiceIpAddress = _httpContext.Connection.RemoteIpAddress.ToString(),
            ServiceUserAgent = "user-agent",
        };
        _request = new ApproveServiceAccountSessionDto
        {
            Pin = "approver pin",
        };
        _command = new ApproveServiceAccountSessionCommand(_userService.Object, _userRepository.Object, new AccessAdapter(), httpContextAccessor.Object, _featureService.Object)
            .WithRequest(_request);

        httpContextAccessor.Setup(a => a.HttpContext).Returns(_httpContext);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _featureService.Setup(s => s.Get(FeatureLookup.ServiceAccountSessions, _token)).ReturnsAsync(() => _feature);
    }

    [Test]
    public async Task ApplyUpdate_WhenLoggedOut_ReturnUnsuccessful()
    {
        _user = null;

        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Not logged in"]));
    }

    [Test]
    public async Task ApplyUpdate_WhenNotPermitted_ReturnUnsuccessful()
    {
        _user = new UserDto
        {
            Access = new()
            {
                LoginServiceAccounts = false,
            }
        };

        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Not permitted"]));
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
    public async Task ApplyUpdate_WhenPermittedButDifferentIpAddress_ReturnsUnsuccessful()
    {
        _model.ServiceIpAddress = "different ip address";

        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Cannot approve session from a different location"]));
    }

    [Test]
    public async Task ApplyUpdate_WhenPermitted_CannotCreateUserWithManageAccessPermission()
    {
        _request.Access = new AccessDto
        {
            ManageAccess = true,
        };

        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Cannot create session with manage access permission"]));
    }

    [Test]
    public async Task ApplyUpdate_WhenPermitted_CannotCreateUserWithLoginServiceAccountsPermission()
    {
        _request.Access = new AccessDto
        {
            LoginServiceAccounts = true,
        };

        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Cannot create session with login service accounts permission"]));
    }

    [Test]
    public async Task ApplyUpdate_WhenPermitted_SetsApproverPinAndCreatesUser()
    {
        _request.Access = new AccessDto
        {
            ManageGames = true,
        };

        var result = await _command.ApplyUpdate(_model, _token);

        var transientUserName = $"{_model.Id}@couragescores.com";
        _userRepository.Verify(u => u.UpsertUser(It.Is<User>(user => user.Access!.ManageGames == true
                                                                     && user.EmailAddress == transientUserName
                                                                     && user.Transient == true)));
        Assert.That(_model.PinFromApprover, Is.EqualTo(_request.Pin));
        Assert.That(_model.ApprovedBy, Is.EqualTo(_user!.Name));
        Assert.That(_model.TransientUsername, Is.EqualTo(transientUserName));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(["Session approved"]));
    }
}
