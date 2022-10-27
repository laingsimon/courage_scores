using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Command;

namespace CourageScores.Services.Division;

public class DivisionService : IDivisionService
{
    private readonly IGenericDataService<Models.Cosmos.Division, DivisionDto> _genericDivisionService;
    private readonly IGenericDataService<Models.Cosmos.Team.Team, TeamDto> _genericTeamService;
    private readonly IGenericDataService<Models.Cosmos.Game.Game, GameDto> _genericGameService;
    private readonly IGenericDataService<Season, SeasonDto> _genericSeasonService;

    public DivisionService(
        IGenericDataService<Models.Cosmos.Division, DivisionDto> genericDivisionService,
        IGenericDataService<Models.Cosmos.Team.Team, TeamDto> genericTeamService,
        IGenericDataService<Models.Cosmos.Game.Game, GameDto> genericGameService,
        IGenericDataService<Season, SeasonDto> genericSeasonService)
    {
        _genericDivisionService = genericDivisionService;
        _genericTeamService = genericTeamService;
        _genericGameService = genericGameService;
        _genericSeasonService = genericSeasonService;
    }

    public async IAsyncEnumerable<DivisionTeamDto> GetTeams(Guid divisionId, [EnumeratorCancellation] CancellationToken token)
    {
        var teams = _genericTeamService.GetWhere($"t.DivisionId = '{divisionId}'", token);

        var season = await _genericSeasonService.GetAll(token).OrderByDescendingAsync(s => s.EndDate).FirstOrDefaultAsync();

        if (season == null)
        {
            yield break;
        }

        await foreach (var team in teams
                           .SelectAsync(t => GetTeam(season, divisionId, t, token))
                           .OrderByDescendingAsync(t => t.Points).WithCancellation(token))
        {
            yield return team;
        }
    }

    public async IAsyncEnumerable<DivisionFixtureDto> GetFixtures(Guid divisionId, [EnumeratorCancellation] CancellationToken token)
    {
        yield break;
    }

    public async IAsyncEnumerable<DivisionPlayerDto> GetPlayers(Guid divisionId, [EnumeratorCancellation] CancellationToken token)
    {
        yield break;
    }

    private async Task<DivisionTeamDto> GetTeam(SeasonDto season, Guid divisionId, TeamDto team, CancellationToken token)
    {
        var games = await _genericGameService
            .GetWhere($"t.DivisionId = '{divisionId}' and (t.Home.Id = '{team.Id}' or t.Away.Id = '{team.Id}')", token)
            .WhereAsync(t => t.Date >= season.StartDate && t.Date < season.EndDate)
            .ToList();

        // TODO: Work out a game breakdown, i.e. wins, losses, etc.

        return new DivisionTeamDto
        {
            TeamName = team.Name,
            Played = games.Count,
            Points = 0,
            Won = 0,
            Lost = 0,
            Drawn = 0,
            Difference = 0,
        };
    }

    #region delegating members
    public Task<DivisionDto?> Get(Guid id, CancellationToken token)
    {
        return _genericDivisionService.Get(id, token);
    }

    public IAsyncEnumerable<DivisionDto> GetAll(CancellationToken token)
    {
        return _genericDivisionService.GetAll(token);
    }

    public Task<ActionResultDto<DivisionDto>> Upsert<TOut>(Guid id, IUpdateCommand<Models.Cosmos.Division, TOut> updateCommand, CancellationToken token)
    {
        return _genericDivisionService.Upsert(id, updateCommand, token);
    }

    public Task<ActionResultDto<DivisionDto>> Delete(Guid id, CancellationToken token)
    {
        return _genericDivisionService.Delete(id, token);
    }

    public IAsyncEnumerable<DivisionDto> GetWhere(string query, CancellationToken token)
    {
        return _genericDivisionService.GetWhere(query, token);
    }

    #endregion
}