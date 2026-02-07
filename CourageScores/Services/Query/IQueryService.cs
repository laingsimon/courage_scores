using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Query;

namespace CourageScores.Services.Query;

public interface IQueryService
{
    Task<ActionResultDto<QueryResponseDto>> ExecuteQuery(QueryRequestDto request, CancellationToken token);
}