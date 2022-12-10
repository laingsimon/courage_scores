using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Data;

namespace CourageScores.Services.Data;

public interface IDataService
{
    Task<ActionResultDto<ExportDataResultDto>> ExportData(ExportResultRequestDto request, CancellationToken token);
}