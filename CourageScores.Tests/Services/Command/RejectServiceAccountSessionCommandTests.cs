using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class RejectServiceAccountSessionCommandTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<IUserService> _userService = null!;
    private UserDto? _user;
    private Mock<IFeatureService> _featureService = null!;
    private ConfiguredFeatureDto _feature = null!;
    private ServiceAccountSession _model = null!;
    private RejectServiceAccountSessionDto _request = null!;

    private RejectServiceAccountSessionCommand _command = null!;

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
        _userService = new Mock<IUserService>();
        _featureService = new Mock<IFeatureService>();
        _feature = new ConfiguredFeatureDto { ConfiguredValue = "true" };
        _model = new ServiceAccountSession
        {
            Id = Guid.NewGuid(),
            FriendlyName = "friendly-name",
            CookieValue = "cookie-value",
            ServiceIpAddress = "ip-address",
            ServiceUserAgent = "user-agent",
        };
        _request = new RejectServiceAccountSessionDto
        {
            Reason = "rejecting request"
        };
        _command = new RejectServiceAccountSessionCommand(_userService.Object, _featureService.Object).WithRequest(_request);

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
    public async Task ApplyUpdate_WhenPermitted_SetsRejectedReason()
    {
        var result = await _command.ApplyUpdate(_model, _token);

        Assert.That(_model.Message, Is.EqualTo(_request.Reason));
        Assert.That(_model.RejectedBy, Is.EqualTo(_user!.Name));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(["Session rejected"]));
    }
}
