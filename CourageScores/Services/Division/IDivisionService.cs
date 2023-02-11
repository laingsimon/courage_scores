using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;

namespace CourageScores.Services.Division;

public interface IDivisionService : IGenericDataService<Models.Cosmos.Division, DivisionDto>
{
    Task<DivisionDataDto> GetDivisionData(DivisionDataFilter filter, CancellationToken token);
}