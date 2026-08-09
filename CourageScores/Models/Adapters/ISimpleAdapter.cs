using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters;

public interface ISimpleAdapter<TModel, TDto>
{
    Task<TDto> Adapt(TModel model, UserAccessContext context, CancellationToken token);
    Task<TModel> Adapt(TDto dto, UserAccessContext context, CancellationToken token);
}
