using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Command;
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

    [HttpGet("/api/Team/{divisionId}/{seasonId}")]
    public IAsyncEnumerable<TeamDto> GetTeams(Guid divisionId, Guid seasonId, CancellationToken token)
    {
        return _teamService
            .GetWhere($"t.DivisionId = '{divisionId}'", token)
            .SelectAsync(t =>
            {
                t.Seasons.RemoveAll(ts => ts.SeasonId != seasonId);
                return t;
            });
    }

    [HttpPut("/api/Team/")]
    public async Task<ActionResultDto<TeamDto>> UpsertTeam(EditTeamDto team, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddOrUpdateTeamCommand>().WithData(team);
        return await _teamService.Upsert(team.Id, command, token);
    }

    [HttpDelete("/api/Team/{id}")]
    public async Task<ActionResultDto<TeamDto>> DeleteTeam(Guid id, CancellationToken token)
    {
        return await _teamService.Delete(id, token);
    }
}