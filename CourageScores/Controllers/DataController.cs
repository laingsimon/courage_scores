﻿using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Data;
using CourageScores.Services.Data;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class DataController : Controller
{
    private readonly IDataService _dataService;
    private readonly ICosmosTableService _cosmosTableService;

    public DataController(IDataService dataService, ICosmosTableService cosmosTableService)
    {
        _dataService = dataService;
        _cosmosTableService = cosmosTableService;
    }

    [HttpPost("/api/Data/Export")]
    public async Task<ActionResultDto<ExportDataResultDto>> ExportData(ExportDataRequestDto request, CancellationToken token)
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
    public async Task<ActionResultDto<ImportDataResultDto>> ImportData([FromForm] ImportDataRequestDto request, CancellationToken token)
    {
        request.Tables = request.Tables.SelectMany(t => t.Split(',')).ToList();
        return await _dataService.ImportData(request, token);
    }
}