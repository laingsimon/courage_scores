using CourageScores.Models.Dtos.Report;

namespace CourageScores.Services.Report;

public interface IReportService
{
    Task<ReportCollectionDto> GetReports(ReportRequestDto request, CancellationToken token);
}
