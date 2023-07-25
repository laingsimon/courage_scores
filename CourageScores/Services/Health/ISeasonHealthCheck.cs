using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Services.Health;

public interface ISeasonHealthCheck
{
    public string Name { get; }

    public Task<HealthCheckResultDto> RunCheck(IReadOnlyCollection<DivisionHealthDto> divisions, HealthCheckContext context);
}