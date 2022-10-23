using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;

namespace CourageScores.Services;

public class TeamService : ITeamService
{
    private readonly ITeamRepository _teamRepository;
    private readonly IAdapter<Team, TeamDto> _teamAdapter;

    public TeamService(ITeamRepository teamRepository, IAdapter<Team, TeamDto> teamAdapter)
    {
        _teamRepository = teamRepository;
        _teamAdapter = teamAdapter;
    }

    public async Task<TeamDto?> GetTeam(Guid id, CancellationToken token)
    {
        var team = await _teamRepository.Get(id, token);
        return team != null
            ? _teamAdapter.Adapt(team)
            : null;
    }

    public async IAsyncEnumerable<TeamDto> GetAllTeams([EnumeratorCancellation] CancellationToken token)
    {
        await foreach (var team in _teamRepository.GetAll(token))
        {
            yield return _teamAdapter.Adapt(team);
        }
    }

    public async Task<ActionResultDto<TeamDto>> UpsertTeam(TeamDto team, CancellationToken token)
    {
        var createdTeam = await _teamRepository.UpsertTeam(_teamAdapter.Adapt(team), token);

        return new ActionResultDto<TeamDto>
        {
            Result = _teamAdapter.Adapt(createdTeam),
            Success = true,
        };
    }
}