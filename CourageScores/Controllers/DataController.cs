using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Data;
using CourageScores.Services.Data;
using Microsoft.AspNetCore.Mvc;
using TypeScriptMapper;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class DataController : Controller
{
    private readonly ICosmosTableService _cosmosTableService;
    private readonly IDataService _dataService;

    public DataController(IDataService dataService, ICosmosTableService cosmosTableService)
    {
        _dataService = dataService;
        _cosmosTableService = cosmosTableService;
    }

    [HttpPost("/api/Data/Export")]
    public async Task<ActionResultDto<ExportDataResultDto>> Export(ExportDataRequestDto request, CancellationToken token)
    {
        return await _dataService.ExportData(request, token);
    }

    [HttpGet("/api/Data/Tables")]
    public IAsyncEnumerable<TableDto> Tables(CancellationToken token)
    {
        return _cosmosTableService.GetTables(token);
    }

    [HttpPost("/api/Data/Import")]
    [RequestFormLimits(KeyLengthLimit = 1024*1027*20)] // 20MB
    [RequestSizeLimit(bytes: 1024*1024*20)] // 20MB
    public async Task<ActionResultDto<ImportDataResultDto>> Import([FromForm] ImportDataRequestDto request, CancellationToken token)
    {
        request.Tables = request.Tables.SelectMany(t => t.Split(',')).ToList();
        return await _dataService.ImportData(request, token);
    }

    [ExcludeFromTypeScript]
    [HttpPost("/api/Data/Backup")]
    public async Task<ActionResultDto<ExportDataResultDto>> ExportData(BackupDataRequestDto request, CancellationToken token)
    {
        return await _dataService.BackupData(request, token);
    }

    [ExcludeFromTypeScript]
    [HttpPost("/api/Data/Restore")]
    [RequestFormLimits(KeyLengthLimit = 1024*1027*20)] // 20MB
    [RequestSizeLimit(bytes: 1024*1024*20)] // 20MB
    public async Task<ActionResultDto<ImportDataResultDto>> ExportData([FromForm] RestoreDataRequestDto request, CancellationToken token)
    {
        return await _dataService.RestoreData(request, token);
    }

    [HttpGet("/api/Data/Browse/{table}/")]
    public async Task<ActionResultDto<IReadOnlyCollection<SingleDataResultDto>>> GetRows(string table, CancellationToken token)
    {
        return await _dataService.Browse(table, token);
    }

    [HttpGet("/api/Data/View/{table}/{id}")]
    public async Task<ActionResultDto<object>> View(string table, Guid id, CancellationToken token)
    {
        return await _dataService.View(table, id, token);
    }
}