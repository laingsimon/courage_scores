using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using CourageScores.Repository;

namespace CourageScores.Services.Team;

public class TeamService : ITeamService
{
    private readonly IGenericRepository<Models.Cosmos.Team.Team> _repository;
    private readonly IAdapter<Models.Cosmos.Team.Team, TeamDto> _adapter;
    private readonly IUserService _userService;
    private readonly IAuditingHelper _auditingHelper;

    public TeamService(
        IGenericRepository<Models.Cosmos.Team.Team> repository,
        IAdapter<Models.Cosmos.Team.Team, TeamDto> adapter,
        IUserService userService,
        IAuditingHelper auditingHelper)
    {
        _repository = repository;
        _adapter = adapter;
        _userService = userService;
        _auditingHelper = auditingHelper;
    }

    public async Task<TeamDto?> GetTeam(Guid id, CancellationToken token)
    {
        var team = await _repository.Get(id, token);
        return team != null
            ? _adapter.Adapt(team)
            : null;
    }

    public async IAsyncEnumerable<TeamDto> GetAllTeams([EnumeratorCancellation] CancellationToken token)
    {
        await foreach (var team in _repository.GetAll(token))
        {
            yield return _adapter.Adapt(team);
        }
    }

    public async Task<ActionResultDto<TeamDto>> UpdateTeam<TOut>(Guid id, IUpdateCommand<Models.Cosmos.Team.Team, TOut> updateCommand, CancellationToken token)
    {
        var user = await _userService.GetUser();

        if (user == null)
        {
            return NotLoggedIn();
        }

        var team = await _repository.Get(id, token);

        if (team == null)
        {
            return NotFound();
        }

        if (!team.CanEdit(user))
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

        var updatedTeam = await _repository.UpsertTeam(team, token);

        return Success(_adapter.Adapt(updatedTeam), outcome.Message);
    }

    public async Task<ActionResultDto<TeamDto>> DeleteTeam(Guid id, CancellationToken token)
    {
        var user = await _userService.GetUser();

        if (user == null)
        {
            return NotLoggedIn();
        }

        var team = await _repository.Get(id, token);

        if (team == null)
        {
            return NotFound();
        }

        if (!team.CanDelete(user))
        {
            return NotPermitted();
        }

        await _auditingHelper.SetDeleted(team);
        await _repository.UpsertTeam(team, token);

        return Success(_adapter.Adapt(team), "Team deleted");
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

    private static ActionResultDto<TeamDto> NotLoggedIn()
    {
        return new ActionResultDto<TeamDto>
        {
            Success = false,
            Warnings =
            {
                "Not logged in"
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
