namespace CourageScores.Services.Identity;

public interface IServiceAccountSessionCleanUpService
{
    Task DeleteExpiredSessions(CancellationToken token);
}
