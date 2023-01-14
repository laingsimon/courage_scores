using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Division;

public class DivisionService : IDivisionService
{
    private readonly IGenericDataService<Models.Cosmos.Division, DivisionDto> _genericDivisionService;
    private readonly IGenericDataService<Models.Cosmos.Team.Team, TeamDto> _genericTeamService;
    private readonly IGenericDataService<Models.Cosmos.Season, SeasonDto> _genericSeasonService;
    private readonly IGenericRepository<Models.Cosmos.Game.Game> _gameRepository;
    private readonly IGenericRepository<TournamentGame> _tournamentGameRepository;
    private readonly IAdapter<TournamentSide, TournamentSideDto> _tournamentSideAdapter;
    private readonly IUserService _userService;
    private readonly ISystemClock _clock;

    public DivisionService(
        IGenericDataService<Models.Cosmos.Division, DivisionDto> genericDivisionService,
        IGenericDataService<Models.Cosmos.Team.Team, TeamDto> genericTeamService,
        IGenericDataService<Models.Cosmos.Season, SeasonDto> genericSeasonService,
        IGenericRepository<Models.Cosmos.Game.Game> gameRepository,
        IGenericRepository<TournamentGame> tournamentGameRepository,
        IAdapter<TournamentSide, TournamentSideDto> tournamentSideAdapter,
        IUserService userService,
        ISystemClock clock)
    {
        _genericDivisionService = genericDivisionService;
        _genericTeamService = genericTeamService;
        _genericSeasonService = genericSeasonService;
        _gameRepository = gameRepository;
        _tournamentGameRepository = tournamentGameRepository;
        _tournamentSideAdapter = tournamentSideAdapter;
        _userService = userService;
        _clock = clock;
    }

    public async Task<DivisionDataDto> GetDivisionData(Guid divisionId, Guid? seasonId, CancellationToken token)
    {
        var division = await _genericDivisionService.Get(divisionId, token);
        if (division == null || division.Deleted != null)
        {
            return new DivisionDataDto();
        }

        var allTeams = await _genericTeamService.GetAll(token).ToList();
        var teams = allTeams.Where(t => t.DivisionId == divisionId).ToList();
        var allSeasons = await _genericSeasonService
            .GetAll(token)
            .OrderByDescendingAsync(s => s.EndDate).ToList();
        var season = seasonId == null
            ? allSeasons.Where(s => s.StartDate <= _clock.UtcNow.Date && s.EndDate >= _clock.UtcNow.Date).MaxBy(s => s.EndDate)
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

        var games = await _gameRepository
            .GetSome($"t.DivisionId = '{divisionId}'", token)
            .WhereAsync(g => g.Date >= season.StartDate && g.Date < season.EndDate)
            .ToList();

        var tournamentGames = await _tournamentGameRepository
            .GetSome($"t.SeasonId = '{season.Id}'", token)
            .WhereAsync(g => g.Date >= season.StartDate && g.Date < season.EndDate)
            .ToList();

        var context = new DivisionDataContext(games, teams, tournamentGames);

        var divisionData = new DivisionData();
        var gameVisitor = new DivisionDataGameVisitor(divisionData, teams.ToDictionary(t => t.Id));
        foreach (var game in games)
        {
            game.Accept(gameVisitor);
        }

        var user = await _userService.GetUser(token);
        var userContext = new UserContext
        {
            CanCreateGames = user?.Access?.ManageGames ?? false
        };

        var divisionDataDto = new DivisionDataDto
        {
            Id = division.Id,
            Name = division.Name,
            Teams = GetTeams(divisionData, teams).OrderByDescending(t => t.Points).ThenBy(t => t.Name).ToList(),
            AllTeams = allTeams.Select(AdaptToDivisionTeamDetailsDto).ToList(),
            TeamsWithoutFixtures = GetTeamsWithoutFixtures(divisionData, teams).OrderBy(t => t.Name).ToList(),
            Fixtures = await GetFixtures(context, userContext, token).OrderByAsync(d => d.Date).ToList(),
            Players = GetPlayers(divisionData).OrderByDescending(p => p.Points).ThenByDescending(p => p.WinPercentage).ThenBy(p => p.Name).ToList(),
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

    private static DivisionTeamDetailsDto AdaptToDivisionTeamDetailsDto(TeamDto team)
    {
        return new DivisionTeamDetailsDto
        {
            Id = team.Id,
            Name = team.Name,
        };
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

    private async IAsyncEnumerable<DivisionFixtureDateDto> GetFixtures(DivisionDataContext context, UserContext userContext, [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var date in context.GetDates())
        {
            context.GamesForDate.TryGetValue(date, out var gamesForDate);
            context.TournamentGamesForDate.TryGetValue(date, out var tournamentGamesForDate);

            yield return new DivisionFixtureDateDto
            {
                Date = date,
                Fixtures = FixturesPerDate(gamesForDate ?? Array.Empty<Models.Cosmos.Game.Game>(), context.Teams, tournamentGamesForDate?.Any() ?? false)
                    .OrderBy(f => f.HomeTeam.Name).ToList(),
                TournamentFixtures = await TournamentFixturesPerDate(tournamentGamesForDate ?? Array.Empty<TournamentGame>(), context.Teams, userContext, token)
                    .OrderByAsync(f => f.Address).ToList(),
                HasKnockoutFixture = gamesForDate?.Any(g => g.IsKnockout) ?? false,
            };
        }
    }

    private static IEnumerable<DivisionPlayerDto> GetPlayers(DivisionData divisionData)
    {
        foreach (var (id, score) in divisionData.Players)
        {
            if (!divisionData.PlayerIdToTeamLookup.TryGetValue(id, out var playerTuple))
            {
                playerTuple = new DivisionData.TeamPlayerTuple(
                    new TeamPlayerDto { Name = score.Player?.Name ?? "Not found" },
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
                Fixtures = divisionData.PlayersToFixtures.ContainsKey(id)
                    ? divisionData.PlayersToFixtures[id]
                    : new Dictionary<DateTime, Guid>(),
            };
        }
    }

    private async IAsyncEnumerable<DivisionTournamentFixtureDetailsDto> TournamentFixturesPerDate(
        IReadOnlyCollection<TournamentGame> tournamentGames,
        IReadOnlyCollection<TeamDto> teams,
        UserContext userContext,
        [EnumeratorCancellation] CancellationToken token)
    {
        var addressesInUse = new HashSet<string>();

        foreach (var game in tournamentGames)
        {
            addressesInUse.Add(game.Address);
            yield return await AdaptToTournamentFixtureDto(game, token);
        }

        if (addressesInUse.Any() && userContext.CanCreateGames)
        {
            foreach (var teamAddress in teams
                         .GroupBy(t => t.Address)
                         .Where(g => !addressesInUse.Contains(g.Key)))
            {
                yield return new DivisionTournamentFixtureDetailsDto
                {
                    Address = string.Join(", ", teamAddress.Select(t => t.Name)),
                    Date = default,
                    Id = default,
                    SeasonId = default,
                    WinningSide = null,
                    Type = null,
                    Proposed = true,
                };
            }
        }
    }

    private async Task<DivisionTournamentFixtureDetailsDto> AdaptToTournamentFixtureDto(TournamentGame tournamentGame, CancellationToken token)
    {
        TournamentSide? winningSide = null;
        var round = tournamentGame.Round;
        var tournamentType = "Tournament";

        if (tournamentGame.Sides.Count > 1)
        {
            var firstSide = tournamentGame.Sides.First();
            switch (firstSide.Players.Count)
            {
                case 1:
                    tournamentType = "Singles";
                    break;
                case 2:
                    tournamentType = "Pairs";
                    break;
            }
        }

        // work out which side won, if any
        while (round != null)
        {
            if (round.NextRound != null)
            {
                round = round.NextRound;
                continue;
            }

            if (round.Matches.Count == 1)
            {
                // the final
                var match = round.Matches.Single();
                if (match.ScoreA != null && match.ScoreB != null)
                {
                    if (match.ScoreA > match.ScoreB)
                    {
                        winningSide = match.SideA;
                    }

                    if (match.ScoreB > match.ScoreA)
                    {
                        winningSide = match.SideB;
                    }
                }
            }

            break;
        }

        return new DivisionTournamentFixtureDetailsDto
        {
            Id = tournamentGame.Id,
            Address = tournamentGame.Address,
            Date = tournamentGame.Date,
            SeasonId = tournamentGame.SeasonId,
            WinningSide = winningSide != null ? await _tournamentSideAdapter.Adapt(winningSide, token) : null,
            Type = tournamentType,
            Proposed = false,
            Players = tournamentGame.Sides.SelectMany(side => side.Players).Select(p => p.Id).ToList(),
        };
    }

    private static IEnumerable<DivisionFixtureDto> FixturesPerDate(IEnumerable<Models.Cosmos.Game.Game> games, IReadOnlyCollection<TeamDto> teams, bool anyTournamentGamesForDate)
    {
        var remainingTeams = teams.ToDictionary(t => t.Id);
        var hasKnockout = false;

        foreach (var game in games)
        {
            remainingTeams.Remove(game.Home.Id);
            remainingTeams.Remove(game.Away.Id);
            hasKnockout = hasKnockout || game.IsKnockout;

            yield return GameToFixture(
                game,
                teams.SingleOrDefault(t => t.Id == game.Home.Id),
                teams.SingleOrDefault(t => t.Id == game.Away.Id));
        }

        if (!anyTournamentGamesForDate)
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
                    },
                    IsKnockout = hasKnockout,
                };
            }
        }
    }

    private static DivisionFixtureDto GameToFixture(Models.Cosmos.Game.Game fixture, TeamDto? homeTeam, TeamDto? awayTeam)
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

    private class DivisionDataContext
    {
        public IReadOnlyCollection<TeamDto> Teams { get; }
        public Dictionary<DateTime, Models.Cosmos.Game.Game[]> GamesForDate { get; }
        public Dictionary<DateTime, TournamentGame[]> TournamentGamesForDate { get; }

        public DivisionDataContext(
            IReadOnlyCollection<Models.Cosmos.Game.Game> games,
            IReadOnlyCollection<TeamDto> teams,
            IReadOnlyCollection<TournamentGame> tournamentGames)
        {
            GamesForDate = games.GroupBy(g => g.Date).ToDictionary(g => g.Key, g => g.ToArray());
            Teams = teams;
            TournamentGamesForDate = tournamentGames.GroupBy(g => g.Date).ToDictionary(g => g.Key, g => g.ToArray());
        }

        public IEnumerable<DateTime> GetDates()
        {
            return GamesForDate.Keys.Union(TournamentGamesForDate.Keys);
        }
    }

    private class UserContext
    {
        public bool CanCreateGames { get; init; }
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
