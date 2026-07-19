using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Services.Identity;

public class UserAccessService : IUserAccessService
{
    private readonly IAccessService _accessService;

    public UserAccessService(IAccessService accessService, UserAccessContext context, UserDto? user)
    {
        _accessService = accessService;
        User = user;
        Context = context;
    }

    public UserDto? User { get; }
    public UserAccessContext Context { get; }

    public async Task<bool> HasAllAccess(AccessOption[] options, CancellationToken token)
    {
        bool? hasAccess = null;

        foreach (var option in options)
        {
            var hasThisAccess = await HasAccess(option, token);
            hasAccess = hasAccess == null ? hasThisAccess : hasAccess & hasThisAccess;
        }

        return hasAccess ?? false;
    }

    public async Task<bool> HasAnyAccess(AccessOption[] options, CancellationToken token)
    {
        foreach (var option in options)
        {
            if (await HasAccess(option, token))
            {
                return true;
            }
        }

        return false;
    }

    public async Task<bool> HasAccess(AccessOption option, CancellationToken token)
    {
        return await _accessService.HasAccess(User, option, Context, token);
    }
}
