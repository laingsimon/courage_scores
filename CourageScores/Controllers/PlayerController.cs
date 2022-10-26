﻿using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Team.Command;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class PlayerController : Controller
{
    private readonly IGenericDataService<Team, TeamDto> _teamService;
    private readonly ICommandFactory _commandFactory;

    public PlayerController(IGenericDataService<Team, TeamDto> teamService, ICommandFactory commandFactory)
    {
        _teamService = teamService;
        _commandFactory = commandFactory;
    }

    [HttpPost("/api/Player/{teamId}")]
    public async Task<ActionResultDto<TeamDto>> AddPlayer(Guid teamId, [FromBody] EditTeamPlayerDto player, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddPlayerCommand>().ForPlayer(player);
        return await _teamService.Upsert(teamId, command, token);
    }

    [HttpDelete("/api/Player/{teamId}/{playerId}")]
    public async Task<ActionResultDto<TeamDto>> RemovePlayer(Guid teamId, Guid playerId, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<RemovePlayerCommand>().ForPlayer(playerId);
        return await _teamService.Upsert(teamId, command, token);
    }
}