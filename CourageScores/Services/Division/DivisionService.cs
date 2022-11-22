using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Command;

namespace CourageScores.Services.Division;

public class DivisionService : IDivisionService
{
    private readonly IGenericDataService<Models.Cosmos.Division, DivisionDto> _genericDivisionService;
    private readonly IGenericDataService<Team, TeamDto> _genericTeamService;
    private readonly IGenericDataService<Season, SeasonDto> _genericSeasonService;
    private readonly IGenericRepository<Game> _gameRepository;

    public DivisionService(
        IGenericDataService<Models.Cosmos.Division, DivisionDto> genericDivisionService,
        IGenericDataService<Team, TeamDto> genericTeamService,
        IGenericDataService<Season, SeasonDto> genericSeasonService,
        IGenericRepository<Game> gameRepository)
    {
        _genericDivisionService = genericDivisionService;
        _genericTeamService = genericTeamService;
        _genericSeasonService = genericSeasonService;
        _gameRepository = gameRepository;
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
            .WhereAsync(g => g.Deleted == null)
            .WhereAsync(g => g.Date >= season.StartDate && g.Date < season.EndDate)
            .ToList();

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
            Fixtures = GetFixtures(games, teams).OrderBy(d => d.Date).ToList(),
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

    private void ApplyRanksAndPointsDifference(IReadOnlyCollection<DivisionTeamDto> teams, IReadOnlyCollection<DivisionPlayerDto> players)
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

    private static IEnumerable<DivisionFixtureDateDto> GetFixtures(IReadOnlyCollection<Game> games, IReadOnlyCollection<TeamDto> teams)
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

    private static IEnumerable<DivisionFixtureDto> FixturesPerDate(IEnumerable<Game> games, IReadOnlyCollection<TeamDto> teams)
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
