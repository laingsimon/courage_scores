using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Command;

namespace CourageScores.Services;

public interface IGenericDataService<TModel, TDto>
    where TModel : AuditedEntity, IPermissionedEntity
    where TDto : AuditedDto
{
    Task<TDto?> Get(Guid id, CancellationToken token);
    
    IAsyncEnumerable<TDto> GetAll(CancellationToken token);

    IAsyncEnumerable<TDto> GetWhere(string query, CancellationToken token);

    Task<ActionResultDto<TDto>> Upsert<TOut>(Guid id, IUpdateCommand<TModel, TOut> updateCommand,
        CancellationToken token);

    Task<ActionResultDto<TDto>> Delete(Guid id, CancellationToken token);
}