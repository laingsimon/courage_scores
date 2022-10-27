using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Division;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class DivisionController : Controller
{
    private readonly IDivisionService _divisionService;
    private readonly ICommandFactory _commandFactory;

    public DivisionController(IDivisionService divisionService, ICommandFactory commandFactory)
    {
        _divisionService = divisionService;
        _commandFactory = commandFactory;
    }

    [HttpGet("/api/Division/{id}")]
    public async Task<DivisionDto?> GetDivision(Guid id, CancellationToken token)
    {
        return await _divisionService.Get(id, token);
    }

    [HttpGet("/api/Division/{id}/Teams")]
    public IAsyncEnumerable<DivisionTeamDto> GetDivisionTeams(Guid id, CancellationToken token)
    {
        return _divisionService.GetTeams(id, token);
    }

    [HttpGet("/api/Division/{id}/Fixtures")]
    public IAsyncEnumerable<DivisionFixtureDto> GetDivisionFixtures(Guid id, CancellationToken token)
    {
        return _divisionService.GetFixtures(id, token);
    }

    [HttpGet("/api/Division/{id}/Players")]
    public IAsyncEnumerable<DivisionPlayerDto> GetDivisionPlayers(Guid id, CancellationToken token)
    {
        return _divisionService.GetPlayers(id, token);
    }

    [HttpGet("/api/Division/")]
    public IAsyncEnumerable<DivisionDto> GetDivisions(CancellationToken token)
    {
        return _divisionService.GetAll(token);
    }

    [HttpPut("/api/Division/")]
    public async Task<ActionResultDto<DivisionDto>> AddOrUpdateDivision(EditDivisionDto division, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateDivisionCommand>().WithData(division);
        return await _divisionService.Upsert(division.Id, command, token);
    }

    [HttpDelete("/api/Division/{id}")]
    public async Task<ActionResultDto<DivisionDto>> DeleteDivision(Guid id, CancellationToken token)
    {
        return await _divisionService.Delete(id, token);
    }
}