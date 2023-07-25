using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health;

public interface IHealthCheckService
{
    Task<SeasonHealthCheckResultDto> Check(Guid seasonId, CancellationToken token);
}