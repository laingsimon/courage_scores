using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public interface IAdapter<TModel, TDto>
    where TModel : AuditedEntity
    where TDto : AuditedDto
{
    public TDto Adapt(TModel model);
    public TModel Adapt(TDto dto);
}