using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Identity;

namespace CourageScores.Services;

public class TeamService : GenericDataService<Team, TeamDto>, ITeamService
{
    public TeamService(
        IGenericRepository<Team> repository,
        IAdapter<Team, TeamDto> adapter,
        IUserService userService,
        IAuditingHelper auditingHelper)
        : base(repository, adapter, userService, auditingHelper)
    { }

    public IAsyncEnumerable<TeamDto> GetTeamsForSeason(Guid divisionId, Guid seasonId, CancellationToken token)
    {
        return GetWhere($"t.DivisionId = '{divisionId}'", token)
            .SelectAsync(t =>
            {
                t.Seasons.RemoveAll(ts => ts.SeasonId != seasonId);
                return t;
            });
    }
}