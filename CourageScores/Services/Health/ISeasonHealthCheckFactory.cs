namespace CourageScores.Services.Health;

public interface ISeasonHealthCheckFactory
{
    IEnumerable<ISeasonHealthCheck> GetHealthChecks();
}