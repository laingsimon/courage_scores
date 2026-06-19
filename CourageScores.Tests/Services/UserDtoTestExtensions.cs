using System.Diagnostics.Contracts;
using CourageScores.Services.Identity;

namespace CourageScores.Tests.Services;

public static class UserDtoTestExtensions
{
    [Pure]
    public static HashSet<AccessOption> With(this HashSet<AccessOption> current, params AccessOption[] options)
    {
        return current.Union(options).ToHashSet();
    }

    [Pure]
    public static HashSet<AccessOption> Without(this HashSet<AccessOption> current, params AccessOption[] options)
    {
        return current.Except(options).ToHashSet();
    }
}
