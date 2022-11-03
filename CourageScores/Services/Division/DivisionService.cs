using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Command;

namespace CourageScores.Services.Division;

public class DivisionService : IDivisionService
{
    private readonly IGenericDataService<Models.Cosmos.Division, DivisionDto> _genericDivisionService;
    private readonly IGenericDataService<Team, TeamDto> _genericTeamService;
    private readonly IGenericDataService<Models.Cosmos.Game.Game, GameDto> _genericGameService;
    private readonly IGenericDataService<Season, SeasonDto> _genericSeasonService;

    public DivisionService(
        IGenericDataService<Models.Cosmos.Division, DivisionDto> genericDivisionService,
        IGenericDataService<Team, TeamDto> genericTeamService,
        IGenericDataService<Models.Cosmos.Game.Game, GameDto> genericGameService,
        IGenericDataService<Season, SeasonDto> genericSeasonService)
    {
        _genericDivisionService = genericDivisionService;
        _genericTeamService = genericTeamService;
        _genericGameService = genericGameService;
        _genericSeasonService = genericSeasonService;
    }

    public async Task<DivisionDataDto> GetDivisionData(Guid divisionId, CancellationToken token)
    {
        var division = await _genericDivisionService.Get(divisionId, token);
        if (division == null)
        {
            return new DivisionDataDto();
        }

        var teams = await _genericTeamService.GetWhere($"t.DivisionId = '{divisionId}'", token).ToList();
        var season = await _genericSeasonService.GetAll(token).OrderByDescendingAsync(s => s.EndDate).FirstOrDefaultAsync();

        if (season == null)
        {
            return new DivisionDataDto
            {
                Id = division.Id,
                Name = division.Name,
            };
        }

        return new DivisionDataDto
        {
            Id = division.Id,
            Name = division.Name,
            SeasonId = season.Id,
            SeasonName = season.Name,
            Teams = await GetTeams(teams, season, divisionId, token).ToList(),
            Fixtures = await GetFixtures(teams, divisionId, token).ToList(),
            Players = GetPlayers(teams, season.Id).ToList(),
        };
    }

    private async IAsyncEnumerable<DivisionTeamDto> GetTeams(
        IReadOnlyCollection<TeamDto> teams,
        SeasonDto season,
        Guid divisionId,
        [EnumeratorCancellation] CancellationToken token)
    {
        var teamsDetails = await teams
            .SelectAsync(t => GetTeam(season, divisionId, t, token))
            .ToList();

        foreach (var team in teamsDetails.OrderByDescending(t => t.Points).ThenBy(t => t.Name))
        {
            yield return team;
        }
    }

    private async IAsyncEnumerable<DivisionFixtureDateDto> GetFixtures(IReadOnlyCollection<TeamDto> teams, Guid divisionId, [EnumeratorCancellation] CancellationToken token)
    {
        var games = await _genericGameService
            .GetWhere($"t.DivisionId = '{divisionId}'", token)
            .ToList();
        var gameDates = games.GroupBy(g => g.Date).OrderBy(d => d.Key);

        foreach (var gamesForDate in gameDates)
        {
            yield return new DivisionFixtureDateDto
            {
                Date = gamesForDate.Key,
                Fixtures = FixturesPerDate(gamesForDate, teams).OrderBy(f => f.HomeTeam).ToList()
            };
        }
    }

    private IEnumerable<DivisionPlayerDto> GetPlayers(IReadOnlyCollection<TeamDto> teams, Guid seasonId)
    {
        foreach (var team in teams)
        {
            var teamSeason = team.Seasons.SingleOrDefault(s => s.SeasonId == seasonId);
            if (teamSeason == null)
            {
                continue;
            }

            foreach (var player in teamSeason.Players)
            {
                yield return new DivisionPlayerDto
                {
                    Id = player.Id,
                    Lost = 0,
                    Name = player.Name,
                    Played = 0,
                    Points = 0,
                    Rank = 0,
                    Won = 0,
                    OneEighties = 0,
                    Over100Checkouts = 0,
                    WinPercentage = 0,
                    Team = team.Name,
                };
            }
        }
    }

    private async Task<DivisionTeamDto> GetTeam(SeasonDto season, Guid divisionId, TeamDto team, CancellationToken token)
    {
        var games = await _genericGameService
            .GetWhere($"t.DivisionId = '{divisionId}'", token)
            .WhereAsync(t => t.Home.Id == team.Id || t.Away.Id == team.Id)
            .WhereAsync(t => t.Date >= season.StartDate && t.Date < season.EndDate)
            .SelectAsync(g => CreateOverview(g, team))
            .ToList();

        return new DivisionTeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Played = games.Sum(g => g.Played),
            Points = games.Sum(g => g.Points),
            Won = games.Sum(g => g.Won),
            Lost = games.Sum(g => g.Lost),
            Drawn = games.Sum(g => g.Drawn),
            Difference = 0,
        };
    }

    private static IEnumerable<DivisionFixtureDto> FixturesPerDate(IEnumerable<GameDto> games, IReadOnlyCollection<TeamDto> teams)
    {
        var remainingTeams = teams.ToDictionary(t => t.Id);

        foreach (var game in games)
        {
            if (game.Home != null)
            {
                remainingTeams.Remove(game.Home.Id);
            }
            if (game.Away != null)
            {
                remainingTeams.Remove(game.Away.Id);
            }

            yield return GameToFixture(game);
        }

        foreach (var remainingTeam in remainingTeams.Values)
        {
            yield return new DivisionFixtureDto
            {
                Id = remainingTeam.Id,
                AwayScore = null,
                HomeScore = null,
                AwayTeam = null,
                HomeTeam = remainingTeam.Name
            };
        }
    }

    private static DivisionFixtureDto GameToFixture(GameDto fixture)
    {
        return new DivisionFixtureDto
        {
            Id = fixture.Id,
            AwayTeam = fixture.Away.Name,
            HomeTeam = fixture.Home.Name,
            AwayScore = fixture.Matches.Any()
                ? fixture.Matches.Sum(m => m.AwayScore > m.HomeScore ? 1 : 0)
                : null,
            HomeScore = fixture.Matches.Any()
                ? fixture.Matches.Sum(m => m.HomeScore > m.AwayScore ? 1 : 0)
                : null,
        };
    }

    private static GameOverview CreateOverview(GameDto game, CosmosDto team)
    {
        var overview = new GameOverview
        {
            Id = game.Id,
            Drawn = game.Matches.Count(m => m.AwayScore == m.HomeScore && m.HomeScore > 0),
            Lost = game.Matches.Count(m => m.HomeScore < m.AwayScore && game.Home.Id == team.Id),
            Won = game.Matches.Count(m => m.HomeScore > m.AwayScore && game.Home.Id == team.Id),
            Played = game.Matches.Any() ? 1 : 0,
            TeamId = team.Id,
        };

        overview.Points = CalculatePoints(overview);

        return overview;
    }

    private static int CalculatePoints(GameOverview overview)
    {
        return 0; // TODO: Work out how points are calculated
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