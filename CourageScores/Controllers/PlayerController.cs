using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Command;
using Microsoft.AspNetCore.Mvc;
using TypeScriptMapper.Controllers;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
[MethodsOnly]
public class PlayerController : Controller
{
    private readonly ICommandFactory _commandFactory;
    private readonly IGenericDataService<Team, TeamDto> _teamService;

    public PlayerController(IGenericDataService<Team, TeamDto> teamService, ICommandFactory commandFactory)
    {
        _teamService = teamService;
        _commandFactory = commandFactory;
    }

    [HttpPost("/api/Player/{divisionId}/{seasonId}/{teamId}")]
    public async Task<ActionResultDto<TeamDto>> Create(Guid divisionId, Guid seasonId, Guid teamId, [FromBody] EditTeamPlayerDto player, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddPlayerToTeamSeasonCommand>()
            .ToSeason(seasonId)
            .ToDivision(divisionId).ForPlayer(player);
        return await _teamService.Upsert(teamId, command, token);
    }

    [HttpDelete("/api/Player/{seasonId}/{teamId}/{playerId}")]
    public async Task<ActionResultDto<TeamDto>> Delete(Guid seasonId, Guid teamId, Guid playerId, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<RemovePlayerCommand>()
            .FromSeason(seasonId)
            .ForPlayer(playerId);
        return await _teamService.Upsert(teamId, command, token);
    }

    [HttpPatch("/api/Player/{seasonId}/{teamId}/{playerId}")]
    public async Task<ActionResultDto<TeamDto>> Update(Guid seasonId, Guid teamId, Guid playerId, [FromBody] EditTeamPlayerDto player, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<UpdatePlayerCommand>()
            .InSeason(seasonId)
            .ForPlayer(playerId)
            .WithData(player);
        return await _teamService.Upsert(teamId, command, token);
    }
}