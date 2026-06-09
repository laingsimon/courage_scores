using CourageScores.Common;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Repository;
using CourageScores.Repository.Identity;

namespace CourageScores.Services.Identity;

public class ServiceAccountSessionCleanUpService : IServiceAccountSessionCleanUpService
{
    private static readonly TimeSpan TimeToLive = TimeSpan.FromHours(3);

    private readonly IGenericRepository<ServiceAccountSession> _repository;
    private readonly IUserRepository _userRepository;
    private readonly TimeProvider _clock;

    public ServiceAccountSessionCleanUpService(
        IGenericRepository<ServiceAccountSession> repository,
        IUserRepository userRepository,
        TimeProvider clock)
    {
        _repository = repository;
        _userRepository = userRepository;
        _clock = clock;
    }

    public async Task DeleteExpiredSessions(CancellationToken token)
    {
        var allSessions = await _repository.GetSome("t.Deleted = null", token).ToList();

        foreach (var session in allSessions)
        {
            if (HasExpired(session))
            {
                await DeleteSession(session, token);
            }
        }
    }

    private bool HasExpired(ServiceAccountSession session)
    {
        var now = _clock.GetUtcNow().DateTime;
        var requestsActive = session.LastRequest != null && now.Subtract(session.LastRequest.Value) < TimeToLive;
        var recentlyUpdated = now.Subtract(session.Updated) < TimeToLive;

        return !requestsActive && !recentlyUpdated;
    }

    private async Task DeleteSession(ServiceAccountSession session, CancellationToken token)
    {
        session.Deleted = DateTime.UtcNow;
        session.Remover = nameof(ServiceAccountSessionCleanUpService);

        if (session.TransientUsername != null)
        {
            await DeleteUser(session.TransientUsername, token);
        }

        await _repository.Upsert(session, token);
    }

    private async Task DeleteUser(string transientUserName, CancellationToken token)
    {
        try
        {
            var user = await _userRepository.GetUser(transientUserName);

            if (user?.Transient == true)
            {
                await _userRepository.DeleteUser(user, token);
            }
        }
        catch (Exception)
        {
            // user not found
        }
    }
}
