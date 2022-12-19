using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Command;

namespace CourageScores.Services.Division;

public class DivisionService : IDivisionService
{
    private readonly IGenericDataService<Models.Cosmos.Division, DivisionDto> _genericDivisionService;
    private readonly IGenericDataService<Team, TeamDto> _genericTeamService;
    private readonly IGenericDataService<Models.Cosmos.Season, SeasonDto> _genericSeasonService;
    private readonly IGenericRepository<Game> _gameRepository;
    private readonly IGenericRepository<KnockoutGame> _knockoutGameRepository;
    private readonly IAdapter<KnockoutGame, KnockoutGameDto> _knockoutGameAdapter;

    public DivisionService(
        IGenericDataService<Models.Cosmos.Division, DivisionDto> genericDivisionService,
        IGenericDataService<Team, TeamDto> genericTeamService,
        IGenericDataService<Models.Cosmos.Season, SeasonDto> genericSeasonService,
        IGenericRepository<Game> gameRepository,
        IGenericRepository<KnockoutGame> knockoutGameRepository,
        IAdapter<KnockoutGame, KnockoutGameDto> knockoutGameAdapter)
    {
        _genericDivisionService = genericDivisionService;
        _genericTeamService = genericTeamService;
        _genericSeasonService = genericSeasonService;
        _gameRepository = gameRepository;
        _knockoutGameRepository = knockoutGameRepository;
        _knockoutGameAdapter = knockoutGameAdapter;
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

        var playerIdToTeamLookup = (from team in teams
            from teamSeason in team.Seasons
            where teamSeason.SeasonId == season.Id
            from player in teamSeason.Players
            select new TeamPlayerTuple(player, team))
            .ToDictionary(t => t.Player.Id);

        var games = await _gameRepository
            .GetSome($"t.DivisionId = '{divisionId}'", token)
            .WhereAsync(g => g.Date >= season.StartDate && g.Date < season.EndDate)
            .ToList();

        var knockoutGames = await _knockoutGameRepository
            .GetSome($"t.SeasonId = '{season.Id}'", token)
            .WhereAsync(g => g.Date >= season.StartDate && g.Date < season.EndDate)
            .ToList();

        var context = new DivisionDataContext(games, teams, knockoutGames);

        var divisionData = new DivisionData();
        var gameVisitor = new DivisionDataGameVisitor(divisionData);
        foreach (var game in games)
        {
            game.Accept(gameVisitor);
        }

        var divisionDataDto = new DivisionDataDto
        {
            Id = division.Id,
            Name = division.Name,
            Teams = GetTeams(divisionData, teams).OrderByDescending(t => t.Points).ThenBy(t => t.Name).ToList(),
            TeamsWithoutFixtures = GetTeamsWithoutFixtures(divisionData, teams).OrderBy(t => t.Name).ToList(),
            Fixtures = await GetFixtures(context).OrderByAsync(d => d.Date).ToList(),
            Players = GetPlayers(divisionData, playerIdToTeamLookup).OrderByDescending(p => p.Points).ThenByDescending(p => p.WinPercentage).ThenBy(p => p.Name).ToList(),
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

        ApplyRanksAndPointsDifference(divisionDataDto.Teams, divisionDataDto.Players);

        return divisionDataDto;
    }

    private static void ApplyRanksAndPointsDifference(IReadOnlyCollection<DivisionTeamDto> teams, IReadOnlyCollection<DivisionPlayerDto> players)
    {
        if (teams.Any())
        {
            var topTeamPoints = teams.First().Points;
            foreach (var team in teams)
            {
                team.Difference = team.Points - topTeamPoints;
            }
        }

        var rank = 1;
        foreach (var player in players)
        {
            player.Rank = rank++;
        }
    }

    private static IEnumerable<DivisionTeamDto> GetTeamsWithoutFixtures(DivisionData divisionData, IReadOnlyCollection<TeamDto> teams)
    {
        foreach (var team in teams.Where(t => !divisionData.Teams.ContainsKey(t.Id)))
        {
            yield return new DivisionTeamDto
            {
                Id = team.Id,
                Address = team.Address,
                Played = 0,
                Name = team.Name,
                Points = 0,
            };
        }
    }

    private static IEnumerable<DivisionTeamDto> GetTeams(DivisionData divisionData, IReadOnlyCollection<TeamDto> teams)
    {
        foreach (var (id, score) in divisionData.Teams)
        {
            var team = teams.SingleOrDefault(t => t.Id == id) ?? new TeamDto { Name = "Not found", Address = "Not found" };

            yield return new DivisionTeamDto
            {
                Id = id,
                Name = team.Name,
                Played = score.Played,
                Points = CalculatePoints(score),
                Won = score.Win,
                Lost = score.Lost,
                Drawn = score.Draw,
                Difference = 0,
                Address = team.Address,
            };
        }
    }

    private async IAsyncEnumerable<DivisionFixtureDateDto> GetFixtures(DivisionDataContext context)
    {
        foreach (var date in context.GetDates())
        {
            context.GamesForDate.TryGetValue(date, out var gamesForDate);
            context.KnockoutGamesForDate.TryGetValue(date, out var knockoutGamesForDate);

            yield return new DivisionFixtureDateDto
            {
                Date = date,
                Fixtures = FixturesPerDate(gamesForDate ?? Array.Empty<Game>(), context.Teams, knockoutGamesForDate?.Any() ?? false).OrderBy(f => f.HomeTeam.Name).ToList(),
                KnockoutFixtures = await KnockoutFixturesPerDate(knockoutGamesForDate ?? Array.Empty<KnockoutGame>(), context.Teams).OrderByAsync(f => f.Address).ToList(),
            };
        }
    }

    private static IEnumerable<DivisionPlayerDto> GetPlayers(DivisionData divisionData, IReadOnlyDictionary<Guid, TeamPlayerTuple> playerIdToTeamLookup)
    {
        foreach (var (id, score) in divisionData.Players)
        {
            if (!playerIdToTeamLookup.TryGetValue(id, out var playerTuple))
            {
                playerTuple = new TeamPlayerTuple(
                    new TeamPlayerDto { Name = "Not found" },
                    new TeamDto { Name = "Not found" });
            }

            yield return new DivisionPlayerDto
            {
                Captain = playerTuple.Player.Captain,
                Id = id,
                Lost = score.Lost,
                Name = playerTuple.Player.Name,
                Played = score.Played,
                Points = CalculatePoints(score),
                Team = playerTuple.Team.Name,
                Won = score.Win,
                OneEighties = score.OneEighty,
                Over100Checkouts = score.HiCheckout,
                TeamId = playerTuple.Team.Id,
                WinPercentage = score.WinPercentage,
            };
        }
    }

    private async IAsyncEnumerable<KnockoutGameDto> KnockoutFixturesPerDate(IReadOnlyCollection<KnockoutGame> knockoutGames, IReadOnlyCollection<TeamDto> teams)
    {
        var addressesInUse = new HashSet<string>();

        foreach (var game in knockoutGames)
        {
            addressesInUse.Add(game.Address);
            yield return await _knockoutGameAdapter.Adapt(game);
        }

        if (addressesInUse.Any())
        {
            foreach (var teamAddress in teams
                         .GroupBy(t => t.Address)
                         .Where(g => !addressesInUse.Contains(g.Key)))
            {
                yield return new KnockoutGameDto
                {
                    Address = string.Join(", ", teamAddress.Select(t => t.Name)),
                    Date = default,
                    Id = default,
                    Round = null,
                    Sides = new(),
                    SeasonId = default,
                };
            }
        }
    }

    private static IEnumerable<DivisionFixtureDto> FixturesPerDate(IEnumerable<Game> games, IReadOnlyCollection<TeamDto> teams, bool anyKnockoutGames)
    {
        var remainingTeams = teams.ToDictionary(t => t.Id);

        foreach (var game in games)
        {
            remainingTeams.Remove(game.Home.Id);
            remainingTeams.Remove(game.Away.Id);

            yield return GameToFixture(
                game,
                teams.SingleOrDefault(t => t.Id == game.Home.Id),
                teams.SingleOrDefault(t => t.Id == game.Away.Id));
        }

        if (!anyKnockoutGames)
        {
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
    }

    private static DivisionFixtureDto GameToFixture(Game fixture, TeamDto? homeTeam, TeamDto? awayTeam)
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
            Postponed = fixture.Postponed,
            IsKnockout = fixture.IsKnockout,
        };
    }

    private static int CalculatePoints(DivisionData.Score score)
    {
        return (score.Win * 3) + (score.Draw * 1);
    }

    private class TeamPlayerTuple
    {
        public TeamPlayerDto Player { get; }
        public TeamDto Team { get; }

        public TeamPlayerTuple(TeamPlayerDto player, TeamDto team)
        {
            Player = player;
            Team = team;
        }
    }

    private class DivisionDataContext
    {
        public IReadOnlyCollection<TeamDto> Teams { get; }
        public Dictionary<DateTime, Game[]> GamesForDate { get; }
        public Dictionary<DateTime, KnockoutGame[]> KnockoutGamesForDate { get; }

        public DivisionDataContext(
            IReadOnlyCollection<Game> games,
            IReadOnlyCollection<TeamDto> teams,
            IReadOnlyCollection<KnockoutGame> knockoutGames)
        {
            GamesForDate = games.GroupBy(g => g.Date).ToDictionary(g => g.Key, g => g.ToArray());
            Teams = teams;
            KnockoutGamesForDate = knockoutGames.GroupBy(g => g.Date).ToDictionary(g => g.Key, g => g.ToArray());
        }

        public IEnumerable<DateTime> GetDates()
        {
            return GamesForDate.Keys.Union(KnockoutGamesForDate.Keys);
        }
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
