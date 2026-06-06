using CourageScores.Models.Cosmos.Identity;
using CourageScores.Repository;
using CourageScores.Repository.Identity;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Identity;

public class ServiceAccountSessionCleanUpServiceTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;

    private Mock<IGenericRepository<ServiceAccountSession>> _repository = null!;
    private Mock<IUserRepository> _userRepository = null!;
    private Mock<TimeProvider> _clock = null!;
    private ServiceAccountSession[] _sessions = null!;

    private IServiceAccountSessionCleanUpService _service = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _repository = new Mock<IGenericRepository<ServiceAccountSession>>();
        _userRepository = new Mock<IUserRepository>();
        _clock = new Mock<TimeProvider>();
        _service = new ServiceAccountSessionCleanUpService(_repository.Object, _userRepository.Object, _clock.Object);
        _sessions = [];

        _repository
            .Setup(r => r.GetSome("t.Deleted = null", _token))
            .Returns(() => TestUtilities.AsyncEnumerable(_sessions));
        _clock.Setup(c => c.GetUtcNow()).Returns(() => _now);
    }

    [Test]
    public async Task DeleteExpiredSessions_WhenNoUndeletedSessions()
    {
        await _service.DeleteExpiredSessions(_token);

        _repository.Verify(r => r.GetSome("t.Deleted = null", _token));
        _repository.VerifyNoOtherCalls();
    }

    [Test]
    public async Task DeleteExpiredSessions_WhenSessionIsActive_DoesNotDeleteSession()
    {
        var activeSession = new ServiceAccountSession
        {
            CookieValue = "cookie-value",
            ServiceIpAddress = "ip-address",
            ServiceUserAgent = "user-agent",
            ApprovedBy = "approver",
            LastRequest = _now.DateTime,
            PinFromApprover = "pin",
            TransientUsername = "a username",
        };
        _sessions = [activeSession];

        await _service.DeleteExpiredSessions(_token);

        _repository.Verify(r => r.Upsert(It.IsAny<ServiceAccountSession>(), _token), Times.Never);
    }

    [Test]
    public async Task DeleteExpiredSessions_WhenSessionHasNotBeenApprovedAfterTimeout_DeletesSession()
    {
        var activeSession = new ServiceAccountSession
        {
            CookieValue = "cookie-value",
            ServiceIpAddress = "ip-address",
            ServiceUserAgent = "user-agent",
            Created = _now.DateTime.AddDays(-1),
            Updated = _now.DateTime.AddDays(-1),
        };
        _sessions = [activeSession];

        await _service.DeleteExpiredSessions(_token);

        _repository.Verify(r => r.Upsert(It.Is<ServiceAccountSession>(s => s.Deleted != null), _token));
    }

    [Test]
    public async Task DeleteExpiredSessions_WhenSessionHasNotBeenUsedSinceTimeout_DeletesSession()
    {
        var activeSession = new ServiceAccountSession
        {
            CookieValue = "cookie-value",
            ServiceIpAddress = "ip-address",
            ServiceUserAgent = "user-agent",
            Created = _now.DateTime.AddDays(-1),
            Updated = _now.DateTime.AddDays(-1),
            LastRequest = _now.DateTime.AddDays(-1),
        };
        _sessions = [activeSession];

        await _service.DeleteExpiredSessions(_token);

        _repository.Verify(r => r.Upsert(It.Is<ServiceAccountSession>(s => s.Deleted != null), _token));
    }

    [Test]
    public async Task DeleteExpiredSessions_WhenSessionHasUserLinked_DeletesUser()
    {
        var activeSession = new ServiceAccountSession
        {
            CookieValue = "cookie-value",
            ServiceIpAddress = "ip-address",
            ServiceUserAgent = "user-agent",
            Created = _now.DateTime.AddDays(-1),
            Updated = _now.DateTime.AddDays(-1),
            LastRequest = _now.DateTime.AddDays(-1),
            TransientUsername = "transient-username",
        };
        var user = new User();
        _sessions = [activeSession];
        _userRepository.Setup(r => r.GetUser(activeSession.TransientUsername)).ReturnsAsync(user);

        await _service.DeleteExpiredSessions(_token);

        _userRepository.Verify(r => r.DeleteUser(user, _token));
    }
}
