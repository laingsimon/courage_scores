using System.Diagnostics.CodeAnalysis;
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
            .SelectAsync(g => CreateOverview(g, team))
            .ToList();

        return new DivisionTeamDto
        {
            TeamName = team.Name,
            Played = games.Count,
            Points = games.Sum(g => g.Points),
            Won = games.Sum(g => g.Won),
            Lost = games.Sum(g => g.Lost),
            Drawn = games.Sum(g => g.Drawn),
            Difference = 0,
        };
    }

    private GameOverview CreateOverview(GameDto game, CosmosDto team)
    {
        var overview = new GameOverview
        {
            Id = game.Id,
            Drawn = game.Matches.Count(m => m.AwayScore == m.HomeScore && m.HomeScore > 0),
            Lost = game.Matches.Count(m => m.HomeScore < m.AwayScore && game.Home.Id == team.Id),
            Won = game.Matches.Count(m => m.HomeScore > m.AwayScore && game.Home.Id == team.Id),
            Played = 1,
            TeamId = team.Id,
        };

        overview.Points = 1; // TODO: Work out how points are calculated

        return overview;
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private class GameOverview
    {
        public Guid Id { get; init; }
        public Guid TeamId { get; init; }
        public int Played { get; init; }
        public int Won { get; init; }
        public int Lost { get; init; }
        public int Drawn { get; init; }
        public int Points { get; set; }
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