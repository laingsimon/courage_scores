using System.Diagnostics.CodeAnalysis;
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

    public async Task<DivisionDataDto> GetDivisionData(Guid divisionId, Guid? seasonId, CancellationToken token)
    {
        var division = await _genericDivisionService.Get(divisionId, token);
        if (division == null || division.Deleted != null)
        {
            return new DivisionDataDto();
        }

        var teams = await _genericTeamService.GetWhere($"t.DivisionId = '{divisionId}'", token).WhereAsync(m => m.Deleted == null).ToList();
        var allSeasons = await _genericSeasonService.GetAll(token).WhereAsync(m => m.Deleted == null)
            .OrderByDescendingAsync(s => s.EndDate).ToList();
        var season = seasonId == null
            ? allSeasons.FirstOrDefault()
            : await _genericSeasonService.Get(seasonId.Value, token);

        if (season == null)
        {
            return new DivisionDataDto
            {
                Id = division.Id,
                Name = division.Name,
                Seasons = allSeasons.Select(s => new DivisionDataSeasonDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    StartDate = s.StartDate,
                    EndDate = s.EndDate,
                }).ToList(),
            };
        }

        var games = await _genericGameService
            .GetWhere($"t.DivisionId = '{divisionId}'", token)
            .WhereAsync(g => g.Deleted == null)
            .WhereAsync(g => g.Date >= season.StartDate && g.Date < season.EndDate)
            .ToList();

        return new DivisionDataDto
        {
            Id = division.Id,
            Name = division.Name,
            Teams = GetTeams(games, teams).OrderByDescending(t => t.Points).ThenBy(t => t.Name).ToList(),
            Fixtures = GetFixtures(games, teams).OrderBy(d => d.Date).ToList(),
            Players = GetPlayers(games, teams, season.Id).OrderByDescending(p => p.Points).ThenByDescending(p => p.WinPercentage).ThenBy(p => p.Name).ToList(),
            Season = new DivisionDataSeasonDto
            {
                Id = season.Id,
                Name = season.Name,
                StartDate = season.StartDate,
                EndDate = season.EndDate,
            },
            Seasons = allSeasons.Select(s => new DivisionDataSeasonDto
            {
                Id = s.Id,
                Name = s.Name,
                StartDate = s.StartDate,
                EndDate = s.EndDate,
            }).ToList(),
        };
    }

    private static IEnumerable<DivisionTeamDto> GetTeams(List<GameDto> games, IReadOnlyCollection<TeamDto> teams)
    {
        return teams.Select(t => GetTeam(games, t));
    }

    private static IEnumerable<DivisionFixtureDateDto> GetFixtures(IReadOnlyCollection<GameDto> games, IReadOnlyCollection<TeamDto> teams)
    {
        var gameDates = games.GroupBy(g => g.Date);

        foreach (var gamesForDate in gameDates)
        {
            yield return new DivisionFixtureDateDto
            {
                Date = gamesForDate.Key,
                Fixtures = FixturesPerDate(gamesForDate, teams).OrderBy(f => f.HomeTeam.Name).ToList()
            };
        }
    }

    private static IEnumerable<DivisionPlayerDto> GetPlayers(IReadOnlyCollection<GameDto> games, IReadOnlyCollection<TeamDto> teams, Guid seasonId)
    {
        foreach (var team in teams)
        {
            var teamSeason = team.Seasons.Where(m => m.Deleted == null).SingleOrDefault(s => s.SeasonId == seasonId);
            if (teamSeason == null)
            {
                continue;
            }

            foreach (var player in teamSeason.Players.Where(p => p.Deleted == null))
            {
                var playedMatches = (from game in games
                    from match in game.Matches
                    where match.AwayPlayers.Count == 1 // singles matches only
                    where match.AwayPlayers.All(p => p.Id == player.Id) || match.HomePlayers.All(p => p.Id == player.Id)
                    select new
                    {
                        HomeTeamId = game.Home.Id,
                        AwayTeamId = game.Away.Id,
                        match.HomeScore,
                        match.AwayScore,
                    }).ToList();

                var wonMatches = playedMatches
                    .Count(m => (m.HomeScore > m.AwayScore && m.HomeTeamId == team.Id)
                                || (m.AwayScore > m.HomeScore && m.AwayTeamId == team.Id));
                var lostMatches = playedMatches
                    .Count(m => (m.HomeScore < m.AwayScore && m.HomeTeamId == team.Id)
                                || (m.AwayScore < m.HomeScore && m.AwayTeamId == team.Id));

                var playerDto = new DivisionPlayerDto
                {
                    Id = player.Id,
                    TeamId = team.Id,
                    Name = player.Name,
                    Captain = player.Captain,
                    Team = team.Name,
                    Lost = lostMatches,
                    Played = playedMatches.Count,
                    Points = 0,
                    Rank = 0,
                    Won = wonMatches,
                    OneEighties = (from game in games
                            from match in game.Matches.Where(m => m.Deleted == null)
                            from oneEighty in match.OneEighties
                            where oneEighty.Id == player.Id
                            select oneEighty).Count(),
                    Over100Checkouts = (from game in games
                        from match in game.Matches.Where(m => m.Deleted == null)
                        from hiCheck in match.Over100Checkouts
                        where hiCheck.Id == player.Id
                        select hiCheck).Count(),
                    WinPercentage = wonMatches > 0 ? ((double)wonMatches / playedMatches.Count) * 100 : 0,
                };

                CalculatePoints(playerDto);

                yield return playerDto;
            }
        }
    }

    private static DivisionTeamDto GetTeam(IReadOnlyCollection<GameDto> games, TeamDto team)
    {
        var thisTeamGames = games.Where(t => t.Home.Id == team.Id || t.Away.Id == team.Id)
            .Select(g => CreateOverview(g, team))
            .ToList();

        return new DivisionTeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Played = thisTeamGames.Sum(g => g.Played),
            Points = thisTeamGames.Sum(g => g.Points),
            Won = thisTeamGames.Count(g => g.MatchesWon > g.MatchesLost),
            Lost = thisTeamGames.Count(g => g.MatchesLost > g.MatchesWon),
            Drawn = thisTeamGames.Count(g => g.MatchesWon == g.MatchesLost && g.MatchesWon > 0),
            Difference = 0,
            Address = team.Address,
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

            yield return GameToFixture(
                game,
                teams.SingleOrDefault(t => t.Id == game.Home?.Id),
                teams.SingleOrDefault(t => t.Id == game.Away?.Id));
        }

        foreach (var remainingTeam in remainingTeams.Values)
        {
            yield return new DivisionFixtureDto
            {
                Id = remainingTeam.Id,
                AwayScore = null,
                HomeScore = null,
                AwayTeam = null,
                HomeTeam = new DivisionFixtureTeamDto
                {
                    Id = remainingTeam.Id,
                    Name = remainingTeam.Name,
                    Address = remainingTeam.Address,
                }
            };
        }
    }

    private static DivisionFixtureDto GameToFixture(GameDto fixture, TeamDto? homeTeam, TeamDto? awayTeam)
    {
        return new DivisionFixtureDto
        {
            Id = fixture.Id,
            AwayTeam = new DivisionFixtureTeamDto
            {
                Id = fixture.Away.Id,
                Name = fixture.Away.Name,
                Address = awayTeam?.Address,
            },
            HomeTeam = new DivisionFixtureTeamDto
            {
                Id = fixture.Home.Id,
                Name = fixture.Home.Name,
                Address = homeTeam?.Address,
            },
            AwayScore = fixture.Matches.Any()
                ? fixture.Matches.Where(m => m.Deleted == null).Count(m => m.AwayScore > m.HomeScore)
                : null,
            HomeScore = fixture.Matches.Any()
                ? fixture.Matches.Where(m => m.Deleted == null).Count(m => m.HomeScore > m.AwayScore)
                : null,
        };
    }

    private static GameOverview CreateOverview(GameDto game, CosmosDto team)
    {
        var overview = new GameOverview
        {
            Id = game.Id,
            MatchesDrawn = game.Matches.Where(m => m.Deleted == null).Count(m => m.AwayScore == m.HomeScore && m.HomeScore > 0),
            MatchesLost = game.Matches.Where(m => m.Deleted == null).Count(m => (m.HomeScore < m.AwayScore && game.Home.Id == team.Id) || (m.HomeScore > m.AwayScore && game.Away.Id == team.Id)),
            MatchesWon = game.Matches.Where(m => m.Deleted == null).Count(m => (m.HomeScore > m.AwayScore && game.Home.Id == team.Id) || (m.HomeScore < m.AwayScore && game.Away.Id == team.Id)),
            Played = game.Matches.Any(m => m.Deleted == null) ? 1 : 0,
            TeamId = team.Id,
        };

        overview.Points = CalculatePoints(overview);

        return overview;
    }

    private static int CalculatePoints(GameOverview overview)
    {
        return 0; // TODO: Work out how points are calculated
    }

    private static int CalculatePoints(DivisionPlayerDto player)
    {
        return 0; // TODO: Work out how points are calculated
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private class GameOverview
    {
        public Guid Id { get; init; }
        public Guid TeamId { get; init; }
        public int Played { get; init; }
        public int MatchesWon { get; init; }
        public int MatchesLost { get; init; }
        public int MatchesDrawn { get; init; }
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
