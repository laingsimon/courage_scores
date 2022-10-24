using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class TeamController : Controller
{
    private readonly ITeamService _teamService;

    public TeamController(ITeamService teamService)
    {
        _teamService = teamService;
    }

    [HttpGet("/api/Team/{id}")]
    public async Task<TeamDto?> GetTeam(Guid id, CancellationToken token)
    {
        return await _teamService.GetTeam(id, token);
    }

    [HttpGet("/api/Team/")]
    public IAsyncEnumerable<TeamDto> GetTeams(CancellationToken token)
    {
        return _teamService.GetAllTeams(token);
    }

    [HttpPut("/api/Team/")]
    public async Task<ActionResultDto<TeamDto>> UpsertTeam(TeamDto team, CancellationToken token)
    {
        return await _teamService.UpsertTeam(team, token);
    }

    [HttpDelete("/api/Team/{id}")]
    public async Task<ActionResultDto<TeamDto>> DeleteTeam(Guid id, CancellationToken token)
    {
        return await _teamService.DeleteTeam(id, token);
    }
}