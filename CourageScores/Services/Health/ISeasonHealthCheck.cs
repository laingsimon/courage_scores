using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health;

public interface ISeasonHealthCheck
{
    public string Name { get; }

    public Task<HealthCheckResultDto> RunCheck(IReadOnlyCollection<DivisionHealthDto> divisions,
        HealthCheckContext context, CancellationToken token);
}