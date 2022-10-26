using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Team.Command;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class TeamController : Controller
{
    private readonly IGenericDataService<Team, TeamDto> _teamService;
    private readonly ICommandFactory _commandFactory;

    public TeamController(IGenericDataService<Team, TeamDto> teamService, ICommandFactory commandFactory)
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

    [HttpPut("/api/Team/")]
    public async Task<ActionResultDto<TeamDto>> UpsertTeam(TeamDto team, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateTeamCommand>().ForTeam(team);
        return await _teamService.Update(team.Id, command, token);
    }

    [HttpDelete("/api/Team/{id}")]
    public async Task<ActionResultDto<TeamDto>> DeleteTeam(Guid id, CancellationToken token)
    {
        return await _teamService.Delete(id, token);
    }

    [HttpPost("/api/Team/{id}")]
    public async Task<ActionResultDto<TeamDto>> AddPlayer(Guid id, [FromBody] TeamPlayerDto player, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddPlayerCommand>().ForPlayer(player);
        return await _teamService.Update(id, command, token);
    }
}