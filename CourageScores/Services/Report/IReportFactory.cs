using CourageScores.Models.Dtos.Report;

namespace CourageScores.Services.Report;

public interface IReportFactory
{
    IAsyncEnumerable<IReport> GetReports(ReportRequestDto request, CancellationToken token);
}