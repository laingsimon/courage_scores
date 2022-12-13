using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Data;
using CourageScores.Services.Data;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class DataController : Controller
{
    private readonly IDataService _dataService;

    public DataController(IDataService dataService)
    {
        _dataService = dataService;
    }

    [HttpPost("/api/Data/Export")]
    public async Task<ActionResultDto<ExportDataResultDto>> ExportData(ExportResultRequestDto request, CancellationToken token)
    {
        return await _dataService.ExportData(request, token);
    }

    [HttpPost("/api/Data/Import")]
    public async Task<ActionResultDto<ImportDataResultDto>> ImportData(ImportDataRequestDto request, CancellationToken token)
    {
        return await _dataService.ImportData(request, token);
    }
}