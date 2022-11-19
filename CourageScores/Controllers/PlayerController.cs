using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Command;
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

    [HttpPost("/api/Player/{seasonId}/{teamId}")]
    public async Task<ActionResultDto<TeamDto>> AddPlayer(Guid seasonId, Guid teamId, [FromBody] EditTeamPlayerDto player, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddPlayerToTeamSeasonCommand>().ToSeason(seasonId).ForPlayer(player);
        return await _teamService.Upsert(teamId, command, token);
    }

    [HttpDelete("/api/Player/{seasonId}/{teamId}/{playerId}")]
    public async Task<ActionResultDto<TeamDto>> RemovePlayer(Guid seasonId, Guid teamId, Guid playerId, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<RemovePlayerCommand>().FromSeason(seasonId).ForPlayer(playerId);
        return await _teamService.Upsert(teamId, command, token);
    }

    [HttpPatch("/api/Player/{seasonId}/{teamId}/{playerId}")]
    public async Task<ActionResultDto<TeamDto>> UpdatePlayer(Guid seasonId, Guid teamId, Guid playerId, [FromBody] EditTeamPlayerDto player, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<UpdatePlayerCommand>().InSeason(seasonId).ForPlayer(playerId).WithData(player);
        return await _teamService.Upsert(teamId, command, token);
    }
}