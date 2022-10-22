using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public interface IAdapter<TModel, TDto>
    where TModel : AuditedEntity
    where TDto : AuditedDto
{
    TDto Adapt(TModel model);
    TModel Adapt(TDto dto);
}