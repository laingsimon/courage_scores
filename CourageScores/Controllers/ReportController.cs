using CourageScores.Models.Dtos.Report;
using CourageScores.Services.Report;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class ReportController : Controller
{
    private readonly IReportService _reportService;

    public ReportController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpPost("/api/Report")]
    public async Task<ReportCollectionDto> GetReports(ReportRequestDto request, CancellationToken token)
    {
        return await _reportService.GetReports(request, token);
    }
}
