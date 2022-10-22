using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class TeamController : Controller
{
    private readonly ITeamRepository _teamRepository;

    public TeamController(ITeamRepository teamRepository)
    {
        _teamRepository = teamRepository;
    }

    [HttpGet("/api/Team/{id}")]
    public async Task<TeamDto?> GetTeam(Guid id, CancellationToken token)
    {
        return await _teamRepository.Get(id, token);
    }

    [HttpGet("/api/Team/")]
    public IAsyncEnumerable<TeamDto> GetTeams(CancellationToken token)
    {
        return _teamRepository.GetAll(token);
    }
}