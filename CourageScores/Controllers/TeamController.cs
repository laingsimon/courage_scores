using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Command;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class TeamController : Controller
{
    private readonly ITeamService _teamService;
    private readonly ICommandFactory _commandFactory;

    public TeamController(ITeamService teamService, ICommandFactory commandFactory)
    {
        _teamService = teamService;
        _commandFactory = commandFactory;
    }

    [HttpGet("/api/Team/{id}")]
    public async Task<TeamDto?> GetTeam(Guid id, CancellationToken token)
    {
        return await _teamService.Get(id, token);
    }

    [HttpGet("/api/Team/")]
    public IAsyncEnumerable<TeamDto> GetTeams(CancellationToken token)
    {
        return _teamService.GetAll(token);
    }

    [HttpGet("/api/Team/{divisionId}/{seasonId}")]
    public IAsyncEnumerable<TeamDto> GetTeams(Guid divisionId, Guid seasonId, CancellationToken token)
    {
        return _teamService.GetTeamsForSeason(divisionId, seasonId, token);
    }

    [HttpPut("/api/Team/")]
    public async Task<ActionResultDto<TeamDto>> UpsertTeam(EditTeamDto team, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateTeamCommand>().WithData(team);
        return await _teamService.Upsert(team.Id, command, token);
    }

    [HttpDelete("/api/Team/{id}/{seasonId}")]
    public async Task<ActionResultDto<TeamDto>> DeleteTeam(Guid id, Guid seasonId, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<DeleteTeamCommand>().FromSeason(seasonId);
        return await _teamService.Upsert(id, command, token);
    }
}