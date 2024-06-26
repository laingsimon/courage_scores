using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Services.Command;
using CourageScores.Services.Division;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class DivisionController : Controller
{
    private readonly ICommandFactory _commandFactory;
    private readonly ICachingDivisionService _divisionService;

    public DivisionController(ICachingDivisionService divisionService, ICommandFactory commandFactory)
    {
        _divisionService = divisionService;
        _commandFactory = commandFactory;
    }

    [HttpGet("/api/Division/{id}")]
    public async Task<DivisionDto?> Get(Guid id, CancellationToken token)
    {
        return await _divisionService.Get(id, token);
    }

    [HttpGet("/api/Division/Data")]
    public async Task<DivisionDataDto> Data([FromQuery] DivisionDataFilter filter, CancellationToken token)
    {
        return await _divisionService.GetDivisionData(filter, token);
    }

    [HttpGet("/api/Division")]
    public IAsyncEnumerable<DivisionDto> GetAll(CancellationToken token)
    {
        return _divisionService.GetAll(token);
    }

    [HttpPut("/api/Division")]
    public async Task<ActionResultDto<DivisionDto>> Update(EditDivisionDto division, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateDivisionCommand>().WithData(division);
        return await _divisionService.Upsert(division.Id, command, token);
    }

    [HttpDelete("/api/Division/{id}")]
    public async Task<ActionResultDto<DivisionDto>> Delete(Guid id, CancellationToken token)
    {
        return await _divisionService.Delete(id, token);
    }
}