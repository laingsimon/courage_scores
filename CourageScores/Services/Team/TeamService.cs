using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Team;

public class TeamService : GenericDataService<Models.Cosmos.Team.Team, TeamDto>, ITeamService
{
    public TeamService(
        IGenericRepository<Models.Cosmos.Team.Team> repository,
        IAdapter<Models.Cosmos.Team.Team, TeamDto> adapter,
        IUserService userService,
        IAuditingHelper auditingHelper,
        IActionResultAdapter actionResultAdapter)
        : base(repository, adapter, userService, auditingHelper, actionResultAdapter)
    { }

    public IAsyncEnumerable<TeamDto> GetTeamsForSeason(Guid seasonId, CancellationToken token)
    {
        return GetAll(token)
            .SelectAsync(t => OnlyForSeason(t, seasonId))
            .WhereAsync(t => t.Seasons.Any());
    }

    public IAsyncEnumerable<TeamDto> GetTeamsForSeason(Guid divisionId, Guid seasonId, CancellationToken token)
    {
        return GetWhere($"t.DivisionId = '{divisionId}'", token)
            .SelectAsync(t => OnlyForSeason(t, seasonId))
            .WhereAsync(t => t.Seasons.Any());
    }

    private static TeamDto OnlyForSeason(TeamDto team, Guid seasonId)
    {
        team.Seasons.RemoveAll(ts => ts.SeasonId != seasonId);
        return team;
    }
}