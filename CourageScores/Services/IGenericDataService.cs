using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Services;

public interface IGenericDataService<TModel, TDto>
    where TModel : AuditedEntity, IPermissionedEntity
    where TDto : AuditedDto
{
    Task<TDto?> Get(Guid id, CancellationToken token);
    
    IAsyncEnumerable<TDto> GetAll(CancellationToken token);

    Task<ActionResultDto<TDto>> Update<TOut>(Guid id, IUpdateCommand<TModel, TOut> updateCommand,
        CancellationToken token);

    Task<ActionResultDto<TDto>> Delete(Guid id, CancellationToken token);
}