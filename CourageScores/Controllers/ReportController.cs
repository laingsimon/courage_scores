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

    [HttpGet("/api/Report/{divisionId}/{seasonId}")]
    public async Task<ReportCollectionDto> GetReports(Guid divisionId, Guid seasonId, CancellationToken token)
    {
        return await _reportService.GetReports(divisionId, seasonId, token);
    }
}