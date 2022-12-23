using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public interface IAdapter<TModel, TDto>
    where TModel : AuditedEntity
    where TDto : AuditedDto
{
    public Task<TDto> Adapt(TModel model, CancellationToken token);
    public Task<TModel> Adapt(TDto dto, CancellationToken token);
}