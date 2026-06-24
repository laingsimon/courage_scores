using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Services.Identity;

public class AccessService : IAccessService
{
    public Task<bool> HasAccess(UserDto? user, AccessOption access, CancellationToken token)
    {
        var userAccess = user?.Access ?? new AccessDto();
        return Task.FromResult(GetAccess(userAccess, access));
    }

    private static bool GetAccess(AccessDto userAccess, AccessOption access)
    {
        var prop = userAccess.GetType().GetProperty(access.ToString());
        if (prop == null)
        {
            return ThrowException($"Access property {access} not found on {nameof(AccessDto)}");
        }

        if (prop.PropertyType != typeof(bool))
        {
            return ThrowException($"Access property {access} on {nameof(AccessDto)} is not a bool");
        }

        var value = prop.GetValue(userAccess);
        return true.Equals(value);
    }

    [ExcludeFromCodeCoverage]
    private static bool ThrowException(string message)
    {
        throw new InvalidOperationException(message);
    }
}
