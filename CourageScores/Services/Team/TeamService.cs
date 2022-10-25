using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository.Team;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Team;

public class TeamService : ITeamService
{
    private readonly ITeamRepository _teamRepository;
    private readonly IAdapter<Models.Cosmos.Team.Team, TeamDto> _teamAdapter;
    private readonly IAccessService _accessService;
    private readonly IAuditingHelper _auditingHelper;

    public TeamService(ITeamRepository teamRepository, IAdapter<Models.Cosmos.Team.Team, TeamDto> teamAdapter, IAccessService accessService, IAuditingHelper auditingHelper)
    {
        _teamRepository = teamRepository;
        _teamAdapter = teamAdapter;
        _accessService = accessService;
        _auditingHelper = auditingHelper;
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
        if (!await _accessService.CanEditTeam(team))
        {
            return NotPermitted();
        }
        var createdTeam = await _teamRepository.UpsertTeam(_teamAdapter.Adapt(team), token);

        return new ActionResultDto<TeamDto>
        {
            Result = _teamAdapter.Adapt(createdTeam),
            Success = true,
        };
    }

    public async Task<ActionResultDto<TeamDto>> UpdateTeam<TOut>(Guid id, IUpdateCommand<Models.Cosmos.Team.Team, TOut> updateCommand, CancellationToken token)
    {
        var team = await _teamRepository.Get(id, token);

        if (team == null)
        {
            return NotFound();
        }

        if (!await _accessService.CanEditTeam(team))
        {
            return NotPermitted();
        }

        var outcome = await updateCommand.ApplyUpdate(team, token);
        if (!outcome.Success)
        {
            return new ActionResultDto<TeamDto>
            {
                Errors =
                {
                    outcome.Message,
                },
                Success = false,
            };
        }

        await _auditingHelper.SetUpdated(team);

        var updatedTeam = await _teamRepository.UpsertTeam(team, token);

        return Success(_teamAdapter.Adapt(updatedTeam), outcome.Message);
    }

    public async Task<ActionResultDto<TeamDto>> DeleteTeam(Guid id, CancellationToken token)
    {
        var team = await _teamRepository.Get(id, token);

        if (team == null)
        {
            return NotFound();
        }

        if (!await _accessService.CanDeleteTeam(team))
        {
            return NotPermitted();
        }

        await _auditingHelper.SetDeleted(team);
        await _teamRepository.UpsertTeam(team, token);

        return Success(_teamAdapter.Adapt(team), "Team deleted");
    }

    private static ActionResultDto<TeamDto> NotFound()
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

    private static ActionResultDto<TeamDto> NotPermitted()
    {
        return new ActionResultDto<TeamDto>
        {
            Success = false,
            Warnings =
            {
                "Not permitted"
            }
        };
    }

    private static ActionResultDto<TeamDto> Success(TeamDto? result, string message)
    {
        return new ActionResultDto<TeamDto>
        {
            Success = true,
            Result = result,
            Messages =
            {
                message
            },
        };
    }
}