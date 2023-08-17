using CourageScores.Models.Cosmos;
using CourageScores.Services.Identity;
using Microsoft.Extensions.Internal;

namespace CourageScores.Services;

public class AuditingHelper : IAuditingHelper
{
    private readonly ISystemClock _clock;
    private readonly IUserService _userService;

    public AuditingHelper(ISystemClock clock, IUserService userService)
    {
        _clock = clock;
        _userService = userService;
    }

    public async Task SetDeleted<T>(T model, CancellationToken token)
        where T : AuditedEntity
    {
        var user = await _userService.GetUser(token);
        if (user != null)
        {
            model.Remover = user.Name;
        }

        model.Deleted = _clock.UtcNow.UtcDateTime;
    }

    public async Task SetUpdated<T>(T model, CancellationToken token)
        where T : AuditedEntity
    {
        var user = await _userService.GetUser(token);
        if (user != null)
        {
            model.Editor = user.Name;

            if (string.IsNullOrEmpty(model.Author))
            {
                // upon creation of an entity
                model.Author = user.Name;
            }
        }

        model.Updated = _clock.UtcNow.UtcDateTime;
        if (model.Created == default)
        {
            // upon creation of an entity
            model.Created = _clock.UtcNow.UtcDateTime;
        }

        // If something is being edited, then it shouldn't be deleted.
        model.Deleted = null;
        model.Remover = null;
    }
}