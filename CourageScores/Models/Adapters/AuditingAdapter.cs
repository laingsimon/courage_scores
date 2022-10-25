using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Identity;
using Microsoft.Extensions.Internal;

namespace CourageScores.Models.Adapters;

public class AuditingAdapter<T, TDto> : IAuditingAdapter<T, TDto>
    where T : AuditedEntity
    where TDto : AuditedDto
{
    private readonly IAdapter<T, TDto> _adapter;
    private readonly ISystemClock _clock;
    private readonly Lazy<UserDto?> _user;

    public AuditingAdapter(IAdapter<T, TDto> adapter, ISystemClock clock, IUserService userService)
    {
        _adapter = adapter;
        _clock = clock;
        _user = new Lazy<UserDto?>(() => userService.GetUser().Result);
    }

    public TDto Adapt(T model)
    {
        return _adapter.Adapt(model);
    }

    public T Adapt(TDto dto)
    {
        var adapted = _adapter.Adapt(dto);
        var user = _user.Value;
        if (user != null)
        {
            adapted.Editor = user.Name;

            if (string.IsNullOrEmpty(adapted.Author))
            {
                // upon creation of an entity
                adapted.Author = user.Name;
            }
        }

        adapted.Updated = _clock.UtcNow.UtcDateTime;
        if (adapted.Created == default)
        {
            // upon creation of an entity
            adapted.Created = _clock.UtcNow.UtcDateTime;
        }

        return adapted;
    }

    public void SetDeleted(T model)
    {
        var user = _user.Value;
        if (user != null)
        {
            model.Remover = user.Name;
        }

        model.Deleted = _clock.UtcNow.UtcDateTime;
    }
}