using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Services.Season.Creation.CompatibilityCheck;

public class CompatibilityCheckFactory : ICompatibilityCheckFactory
{
    [ExcludeFromCodeCoverage]
    public ICompatibilityCheck CreateChecks()
    {
        return new CompositeCompatibilityCheck([
            new SameNumberOfDivisions(),
            new NoMoreThanTemplateDivisionTeamCount(),
            new EachDivisionHasRightNumberOfTeamsWithSharedAddress(),
            new SeasonHasRightNumberOfTeamsWithSharedAddress()
        ]);
    }
}
