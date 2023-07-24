using CourageScores.Services.Health.Checks;

namespace CourageScores.Services.Health;

public class SeasonHealthCheckFactory : ISeasonHealthCheckFactory
{
    public IEnumerable<ISeasonHealthCheck> GetHealthChecks()
    {
        yield return new FixturesAfterStartDate();
        yield return new FixturesBeforeEndDate();
        yield return new TeamsHaveBothLegs();
    }
}