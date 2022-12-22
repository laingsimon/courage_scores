using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Data;

namespace CourageScores.Services.Data;

public interface IDataService
{
    Task<ActionResultDto<ExportDataResultDto>> ExportData(ExportDataRequestDto request, CancellationToken token);
    Task<ActionResultDto<ImportDataResultDto>> ImportData(ImportDataRequestDto request, CancellationToken token);
    IAsyncEnumerable<TableDto> GetTables(CancellationToken token);
}