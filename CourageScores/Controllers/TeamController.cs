using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Command;
using CourageScores.Services.Team;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class TeamController : Controller
{
    private readonly ICommandFactory _commandFactory;
    private readonly ICachingTeamService _teamService;

    public TeamController(ICachingTeamService teamService, ICommandFactory commandFactory)
    {
        _teamService = teamService;
        _commandFactory = commandFactory;
    }

    [HttpGet("/api/Team/{id}")]
    public async Task<TeamDto?> Get(Guid id, CancellationToken token)
    {
        return await _teamService.Get(id, token);
    }

    [HttpGet("/api/Team/")]
    public IAsyncEnumerable<TeamDto> GetAll(CancellationToken token)
    {
        return _teamService.GetAll(token);
    }

    [HttpGet("/api/Team/{divisionId}/{seasonId}")]
    public IAsyncEnumerable<TeamDto> GetForDivisionAndSeason(Guid divisionId, Guid seasonId, CancellationToken token)
    {
        return _teamService.GetTeamsForSeason(divisionId, seasonId, token);
    }

    [HttpPut("/api/Team/")]
    public async Task<ActionResultDto<TeamDto>> Update(EditTeamDto team, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateTeamCommand>().WithData(team);
        return await _teamService.Upsert(team.Id ?? Guid.NewGuid(), command, token);
    }

    [HttpDelete("/api/Team/{id}/{seasonId}")]
    public async Task<ActionResultDto<TeamDto>> Delete(Guid id, Guid seasonId, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<DeleteTeamCommand>().FromSeason(seasonId);
        return await _teamService.Upsert(id, command, token);
    }

    [HttpPut("/api/Team/Season")]
    public async Task<ActionResultDto<TeamDto>> Add(ModifyTeamSeasonDto request, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddSeasonToTeamCommand>().ForSeason(request.SeasonId).ForDivision(request.DivisionId);
        if (request.CopyPlayersFromSeasonId != null)
        {
            command = command.CopyPlayersFromSeasonId(request.CopyPlayersFromSeasonId.Value);
        }

        return await _teamService.Upsert(request.Id, command, token);
    }
}