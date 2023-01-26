using CourageScores.Models.Dtos.Data;

namespace CourageScores.Services.Data;

public interface ICosmosTableService
{
    IAsyncEnumerable<TableDto> GetTables(CancellationToken token);
    IAsyncEnumerable<ITableAccessor> GetTables(ExportDataRequestDto request, CancellationToken token);
}