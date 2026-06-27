using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Identity;

[ExcludeFromCodeCoverage]
public class AccessLevelDto
{
    public static readonly AccessLevelDto Granted = new();

    // properties will be added here once all the refactoring is complete
    // for now, the presence of this object is equivalent to `true`
}
