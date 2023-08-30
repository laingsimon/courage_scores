using System.Runtime.CompilerServices;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using Microsoft.Extensions.Caching.Memory;

namespace CourageScores.Services.Team;

public class CachingTeamService : CachingDataService<Models.Cosmos.Team.Team, TeamDto>, ICachingTeamService
{
    private readonly ITeamService _teamService;

    public CachingTeamService(ITeamService teamService, IMemoryCache memoryCache, IUserService userService, IHttpContextAccessor accessor)
        : base(teamService, memoryCache, userService, accessor)
    {
        _teamService = teamService;
    }

    public async IAsyncEnumerable<TeamDto> GetTeamsForSeason(Guid seasonId, [EnumeratorCancellation] CancellationToken token)
    {
        var key = new CacheKey(seasonId, null);
        foreach (var team in await CacheIfNotLoggedIn(key, () => _teamService.GetTeamsForSeason(seasonId, token).ToList(), token))
        {
            yield return team;
        }
    }

    public async IAsyncEnumerable<TeamDto> GetTeamsForSeason(Guid divisionId, Guid seasonId, [EnumeratorCancellation] CancellationToken token)
    {
        var key = new CacheKey(seasonId, divisionId.ToString());
        foreach (var team in await CacheIfNotLoggedIn(key, () => _teamService.GetTeamsForSeason(divisionId, seasonId, token).ToList(), token))
        {
            yield return team;
        }
    }
}