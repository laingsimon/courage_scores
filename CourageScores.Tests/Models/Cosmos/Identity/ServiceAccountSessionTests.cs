using AutoFixture;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Cosmos.Identity;

[TestFixture]
public class ServiceAccountSessionTests
{
    private IFixture _testFactory = null!;
    private ServiceAccountSession _session = null!;
    private Mock<IUserAccessService> _service = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _user = null;
        _testFactory = AutoFixture.Create();
        _service = _testFactory.FreezeMock<IUserAccessService>();
        _session = _testFactory.Create<ServiceAccountSession>();

        _service.Setup(s => s.User).Returns(() => _user);
    }

    [Test]
    public async Task CanDelete_WhenLoggedOut_ReturnsFalse()
    {
        var result = await _session.CanDelete(_service.Object, CancellationToken.None);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanDelete_WhenTheLoggedInSession_ReturnsTrue()
    {
        _user = new UserDto { EmailAddress = _session.TransientUsername! };

        var result = await _session.CanDelete(_service.Object, CancellationToken.None);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanDelete_WhenADifferentSession_ReturnsFalse()
    {
        _user = new UserDto { EmailAddress = Guid.NewGuid().ToString() };

        var result = await _session.CanDelete(_service.Object, CancellationToken.None);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanDelete_WhenPermitted_ReturnsTrue()
    {
        _service.Setup(s => s.HasAccess(AccessOption.LoginServiceAccounts, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _session.CanDelete(_service.Object, CancellationToken.None);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanDelete_WhenNotPermitted_ReturnsFalse()
    {
        _service.Setup(s => s.HasAccess(AccessOption.LoginServiceAccounts, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await _session.CanDelete(_service.Object, CancellationToken.None);

        Assert.That(result, Is.False);
    }
}
