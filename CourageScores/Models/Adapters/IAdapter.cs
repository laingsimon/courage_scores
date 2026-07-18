using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters;

public interface IAdapter<TModel, TDto>
    where TModel : AuditedEntity
    where TDto : AuditedDto
{
    Task<TDto> Adapt(TModel model, UserAccessContext context, CancellationToken token);
    Task<TModel> Adapt(TDto dto, UserAccessContext context, CancellationToken token);
}
