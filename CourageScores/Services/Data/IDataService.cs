using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Data;

namespace CourageScores.Services.Data;

public interface IDataService
{
    Task<ActionResultDto<ExportDataResultDto>> ExportData(ExportDataRequestDto request, CancellationToken token);
    Task<ActionResultDto<ImportDataResultDto>> ImportData(ImportDataRequestDto request, CancellationToken token);
    Task<ActionResultDto<ExportDataResultDto>> BackupData(BackupDataRequestDto request, CancellationToken token);
    Task<ActionResultDto<ImportDataResultDto>> RestoreData(RestoreDataRequestDto request, CancellationToken token);
    Task<ActionResultDto<SingleDataResultDto>> Browse(string table, Guid id, CancellationToken token);
    Task<ActionResultDto<IReadOnlyCollection<SingleDataResultDto>>> Browse(string table, CancellationToken token);
    Task<ActionResultDto<object>> View(string table, Guid id, CancellationToken token);
}