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
    private readonly ITeamService _teamService;

    public TeamController(CachingTeamService teamService, ICommandFactory commandFactory)
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

    [HttpPut("/api/Team/{id}/{seasonId}")]
    public async Task<ActionResultDto<TeamDto>> AddTeamToSeason(ModifyTeamSeasonDto request, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddSeasonToTeamCommand>().ForSeason(request.SeasonId).ForDivision(request.DivisionId);
        if (request.CopyPlayersFromSeasonId != null)
        {
            command = command.CopyPlayersFromSeasonId(request.CopyPlayersFromSeasonId.Value);
        }

        return await _teamService.Upsert(request.Id, command, token);
    }
}