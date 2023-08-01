using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Services.Season.Creation.CompatibilityCheck;

public class CompatibilityCheckFactory : ICompatibilityCheckFactory
{
    [ExcludeFromCodeCoverage]
    public ICompatibilityCheck CreateChecks()
    {
        return new CompositeCompatibilityCheck(new ICompatibilityCheck[]
        {
            new SameNumberOfDivisions(),
            new NoMoreThanTemplateDivisionTeamCount(),
        });
    }
}