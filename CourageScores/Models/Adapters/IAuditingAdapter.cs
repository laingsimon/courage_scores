using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public interface IAuditingAdapter<T, TDto> : IAdapter<T, TDto>
    where T : AuditedEntity
    where TDto : AuditedDto
{
    void SetDeleted(T model);
}