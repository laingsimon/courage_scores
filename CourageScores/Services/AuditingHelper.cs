using CourageScores.Models.Cosmos;
using CourageScores.Services.Identity;

namespace CourageScores.Services;

public class AuditingHelper : IAuditingHelper
{
    private readonly TimeProvider _clock;
    private readonly IUserService _userService;

    public AuditingHelper(TimeProvider clock, IUserService userService)
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

        model.Deleted = _clock.GetUtcNow().UtcDateTime;
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

        model.Updated = _clock.GetUtcNow().UtcDateTime;
        if (model.Created == default)
        {
            // upon creation of an entity
            model.Created = _clock.GetUtcNow().UtcDateTime;
        }

        // If something is being edited, then it shouldn't be deleted.
        model.Deleted = null;
        model.Remover = null;
    }
}