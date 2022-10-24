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
    private readonly IAuditingAdapter<Team, TeamDto> _teamAdapter;
    private readonly IIdentityService _identityService;

    public TeamService(ITeamRepository teamRepository, IAuditingAdapter<Team, TeamDto> teamAdapter, IIdentityService identityService)
    {
        _teamRepository = teamRepository;
        _teamAdapter = teamAdapter;
        _identityService = identityService;
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
        var identity = await _identityService.GetUser();
        if (identity?.Admin != true)
        {
            return new ActionResultDto<TeamDto>
            {
                Success = false,
                Warnings =
                {
                    "Not an admin"
                }
            };
        }
        var createdTeam = await _teamRepository.UpsertTeam(_teamAdapter.Adapt(team), token);

        return new ActionResultDto<TeamDto>
        {
            Result = _teamAdapter.Adapt(createdTeam),
            Success = true,
        };
    }

    public async Task<ActionResultDto<TeamDto>> DeleteTeam(Guid id, CancellationToken token)
    {
        var identity = await _identityService.GetUser();
        if (identity?.Admin != true)
        {
            return new ActionResultDto<TeamDto>
            {
                Success = false,
                Warnings =
                {
                    "Not an admin"
                }
            };
        }

        var team = await _teamRepository.Get(id, token);

        if (team == null)
        {
            return new ActionResultDto<TeamDto>
            {
                Success = false,
                Warnings =
                {
                    "Team not found"
                }
            };
        }

        _teamAdapter.SetDeleted(team);
        await _teamRepository.UpsertTeam(team, token);

        return new ActionResultDto<TeamDto>
        {
            Result = _teamAdapter.Adapt(team),
            Success = true,
            Messages =
            {
                "Team deleted"
            }
        };
    }
}