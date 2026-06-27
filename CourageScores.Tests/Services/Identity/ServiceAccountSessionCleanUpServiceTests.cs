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
    private User[] _users = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _users = [];
        _repository = new Mock<IGenericRepository<ServiceAccountSession>>();
        _userRepository = new Mock<IUserRepository>();
        _clock = new Mock<TimeProvider>();
        _service = new ServiceAccountSessionCleanUpService(_repository.Object, _userRepository.Object, _clock.Object);
        _sessions = [];

        _userRepository
            .Setup(r => r.GetAll(_token))
            .Returns(() => TestUtilities.AsyncEnumerable(_users));
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
            VerificationValue = "cookie-value",
            ServiceIpAddress = "ip-address",
            ServiceUserAgent = "user-agent",
            FriendlyName = "friendly-name",
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
            VerificationValue = "cookie-value",
            ServiceIpAddress = "ip-address",
            ServiceUserAgent = "user-agent",
            FriendlyName = "friendly-name",
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
            VerificationValue = "cookie-value",
            ServiceIpAddress = "ip-address",
            FriendlyName = "friendly-name",
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
    public async Task DeleteExpiredSessions_WhenSessionHasUserLinkedButUserCannotBeFound_DoesNotThrow()
    {
        var activeSession = new ServiceAccountSession
        {
            VerificationValue = "cookie-value",
            ServiceIpAddress = "ip-address",
            ServiceUserAgent = "user-agent",
            FriendlyName = "friendly-name",
            Created = _now.DateTime.AddDays(-1),
            Updated = _now.DateTime.AddDays(-1),
            LastRequest = _now.DateTime.AddDays(-1),
            TransientUsername = "transient-username",
        };
        _sessions = [activeSession];
        _userRepository.Setup(r => r.GetUser(activeSession.TransientUsername, _token)).ThrowsAsync(new InvalidOperationException("user not found"));

        await Assert.ThatAsync(
            () => _service.DeleteExpiredSessions(_token),
            Throws.Nothing);
    }

    [Test]
    public async Task DeleteExpiredSessions_WhenSessionHasUserLinked_DeletesUser()
    {
        var activeSession = new ServiceAccountSession
        {
            VerificationValue = "cookie-value",
            ServiceIpAddress = "ip-address",
            ServiceUserAgent = "user-agent",
            FriendlyName = "friendly-name",
            Created = _now.DateTime.AddDays(-1),
            Updated = _now.DateTime.AddDays(-1),
            LastRequest = _now.DateTime.AddDays(-1),
            TransientUsername = "transient-username",
        };
        var user = new User
        {
            Transient = true,
        };
        _sessions = [activeSession];
        _userRepository.Setup(r => r.GetUser(activeSession.TransientUsername, _token)).ReturnsAsync(user);

        await _service.DeleteExpiredSessions(_token);

        _userRepository.Verify(r => r.DeleteUser(user, _token));
    }

    [Test]
    public async Task DeleteExpiredSessions_WhenTransientUsersAreOrphaned_DeletesUsers()
    {
        var transientUser = new User
        {
            Transient = true,
        };
        var regularUser = new User
        {
            Transient = false,
        };
        _users = [transientUser, regularUser];

        await _service.DeleteExpiredSessions(_token);

        _userRepository.Verify(r => r.DeleteUser(transientUser, _token));
        _userRepository.Verify(r => r.DeleteUser(regularUser, _token), Times.Never);
    }

    [Test]
    public async Task DeleteExpiredSessions_WhenExceptionThrownWhenOrphanedUserIsDeleted_DoesNotThrow()
    {
        var transientUser = new User
        {
            Transient = true,
        };
        _users = [transientUser];
        _userRepository
            .Setup(r => r.DeleteUser(transientUser, _token))
            .ThrowsAsync(new InvalidOperationException("error"));

        await Assert.ThatAsync(() => _service.DeleteExpiredSessions(_token), Throws.Nothing);

        _userRepository.Verify(r => r.DeleteUser(transientUser, _token));
    }
}
