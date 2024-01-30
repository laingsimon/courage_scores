using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Report;
using CourageScores.Services.Report;
using Microsoft.AspNetCore.Mvc;
using TypeScriptMapper.Controllers;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
[MethodsOnly]
public class ReportController : Controller
{
    private readonly IReportService _reportService;

    public ReportController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpPost("/api/Report")]
    public async Task<ReportCollectionDto> GetReport(ReportRequestDto request, CancellationToken token)
    {
        return await _reportService.GetReports(request, token);
    }
}