using System.Diagnostics.CodeAnalysis;
using CourageScores.Services.Health.Checks;

namespace CourageScores.Services.Health;

public class SeasonHealthCheckFactory : ISeasonHealthCheckFactory
{
    [ExcludeFromCodeCoverage]
    public IEnumerable<ISeasonHealthCheck> GetHealthChecks()
    {
        yield return new FixturesAfterStartDate();
        yield return new FixturesBeforeEndDate();
        yield return new TeamsHaveBothLegs();
        yield return new ContiguousHomeOrAwayFixtures();
        yield return new TeamsAreNotPlayingAgainstThemselves();
        yield return new TeamsPlayingMultipleFixturesOnSameDate();
        yield return new VenuesBeingUsedByMultipleTeamsOnSameDate();
        yield return new ContiguousByes();
    }
}