using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Team;
using CourageScores.Services.Team.Command;
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

    [HttpPost("/api/Team/{id}")]
    public async Task<ActionResultDto<TeamDto>> AddPlayer(Guid id, [FromBody] TeamPlayerDto player, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddPlayerCommand>().ForPlayer(player);
        return await _teamService.UpdateTeam(id, command, token);
    }
}