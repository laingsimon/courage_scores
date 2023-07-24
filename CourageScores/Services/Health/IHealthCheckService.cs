using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health;

public interface IHealthCheckService
{
    Task<HealthCheckResultDto> Check(Guid seasonId, CancellationToken token);
}