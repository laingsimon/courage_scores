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
    public async Task<ActionResultDto<ExportDataResultDto>> ExportData(ExportDataRequestDto request, CancellationToken token)
    {
        return await _dataService.ExportData(request, token);
    }

    [HttpGet("/api/Data/Tables")]
    public IAsyncEnumerable<TableDto> Tables(CancellationToken token)
    {
        return _dataService.GetTables(token);
    }

    [HttpPost("/api/Data/Import")]
    [RequestFormLimits(KeyLengthLimit = 1024*1027*20)] // 20MB
    [RequestSizeLimit(bytes: 1024*1024*20)] // 20MB
    public async Task<ActionResultDto<ImportDataResultDto>> ImportData([FromForm] ImportDataRequestDto request, CancellationToken token)
    {
        return await _dataService.ImportData(request, token);
    }
}