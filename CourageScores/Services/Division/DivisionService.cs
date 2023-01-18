using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Command;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Division;

public class DivisionService : IDivisionService
{
    private readonly IGenericDataService<Models.Cosmos.Division, DivisionDto> _genericDivisionService;
    private readonly IGenericDataService<Models.Cosmos.Team.Team, TeamDto> _genericTeamService;
    private readonly IGenericDataService<Models.Cosmos.Season, SeasonDto> _genericSeasonService;
    private readonly IGenericRepository<Models.Cosmos.Game.Game> _gameRepository;
    private readonly IGenericRepository<TournamentGame> _tournamentGameRepository;
    private readonly IGenericDataService<FixtureDateNote, FixtureDateNoteDto> _noteService;
    private readonly ISystemClock _clock;
    private readonly IDivisionPlayerAdapter _divisionPlayerAdapter;
    private readonly IDivisionTeamAdapter _divisionTeamAdapter;
    private readonly IDivisionTeamDetailsAdapter _divisionTeamDetailsAdapter;
    private readonly IDivisionDataSeasonAdapter _divisionDataSeasonAdapter;
    private readonly IDivisionFixtureDateAdapter _divisionFixtureDateAdapter;

    public DivisionService(
        IGenericDataService<Models.Cosmos.Division, DivisionDto> genericDivisionService,
        IGenericDataService<Models.Cosmos.Team.Team, TeamDto> genericTeamService,
        IGenericDataService<Models.Cosmos.Season, SeasonDto> genericSeasonService,
        IGenericRepository<Models.Cosmos.Game.Game> gameRepository,
        IGenericRepository<TournamentGame> tournamentGameRepository,
        IGenericDataService<FixtureDateNote, FixtureDateNoteDto> noteService,
        ISystemClock clock,
        IDivisionPlayerAdapter divisionPlayerAdapter,
        IDivisionTeamAdapter divisionTeamAdapter,
        IDivisionTeamDetailsAdapter divisionTeamDetailsAdapter,
        IDivisionDataSeasonAdapter divisionDataSeasonAdapter,
        IDivisionFixtureDateAdapter divisionFixtureDateAdapter)
    {
        _genericDivisionService = genericDivisionService;
        _genericTeamService = genericTeamService;
        _genericSeasonService = genericSeasonService;
        _gameRepository = gameRepository;
        _tournamentGameRepository = tournamentGameRepository;
        _noteService = noteService;
        _clock = clock;
        _divisionPlayerAdapter = divisionPlayerAdapter;
        _divisionTeamAdapter = divisionTeamAdapter;
        _divisionTeamDetailsAdapter = divisionTeamDetailsAdapter;
        _divisionDataSeasonAdapter = divisionDataSeasonAdapter;
        _divisionFixtureDateAdapter = divisionFixtureDateAdapter;
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
                Seasons = await allSeasons.SelectAsync(_divisionDataSeasonAdapter.Adapt).ToList(),
            };
        }

        var notes = await _noteService.GetWhere($"t.SeasonId = '{season.Id}'", token)
            .WhereAsync(n => n.DivisionId == null || n.DivisionId == divisionId)
            .ToList();
        var games = await _gameRepository
            .GetSome($"t.DivisionId = '{divisionId}'", token)
            .WhereAsync(g => g.Date >= season.StartDate && g.Date < season.EndDate)
            .ToList();
        var tournamentGames = await _tournamentGameRepository
            .GetSome($"t.SeasonId = '{season.Id}'", token)
            .WhereAsync(g => g.Date >= season.StartDate && g.Date < season.EndDate)
            .ToList();

        var context = new DivisionDataContext(games, teams, tournamentGames, notes);

        var divisionData = new DivisionData();
        var gameVisitor = new DivisionDataGameVisitor(divisionData, teams.ToDictionary(t => t.Id));
        foreach (var game in games)
        {
            game.Accept(gameVisitor);
        }

        var divisionDataDto = new DivisionDataDto
        {
            Id = division.Id,
            Name = division.Name,
            Teams = (await GetTeams(divisionData, teams).ToList())
                .OrderByDescending(t => t.Points).ThenBy(t => t.Name).ToList(),
            AllTeams = await allTeams.SelectAsync(_divisionTeamDetailsAdapter.Adapt).ToList(),
            TeamsWithoutFixtures = await GetTeamsWithoutFixtures(divisionData, teams)
                .SelectAsync(_divisionTeamAdapter.WithoutFixtures)
                .OrderByAsync(t => t.Name).ToList(),
            Fixtures = await GetFixtures(context, token).OrderByAsync(d => d.Date).ToList(),
            Players = (await GetPlayers(divisionData).ToList())
                .OrderByDescending(p => p.Points)
                .ThenByDescending(p => p.WinPercentage)
                .ThenByDescending(p => p.PlayedPairs)
                .ThenByDescending(p => p.PlayedTriples)
                .ThenBy(p => p.Name).ToList(),
            Season = await _divisionDataSeasonAdapter.Adapt(season),
            Seasons = await allSeasons.SelectAsync(_divisionDataSeasonAdapter.Adapt).ToList(),
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

    private IEnumerable<TeamDto> GetTeamsWithoutFixtures(DivisionData divisionData, IReadOnlyCollection<TeamDto> teams)
    {
        return teams.Where(t => !divisionData.Teams.ContainsKey(t.Id));
    }

    private async IAsyncEnumerable<DivisionTeamDto> GetTeams(DivisionData divisionData, IReadOnlyCollection<TeamDto> teams)
    {
        foreach (var (id, score) in divisionData.Teams)
        {
            var team = teams.SingleOrDefault(t => t.Id == id) ?? new TeamDto { Name = "Not found", Address = "Not found" };

            yield return await _divisionTeamAdapter.Adapt(team, score);
        }
    }

    private async IAsyncEnumerable<DivisionFixtureDateDto> GetFixtures(DivisionDataContext context, [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var date in context.GetDates())
        {
            context.GamesForDate.TryGetValue(date, out var gamesForDate);
            context.TournamentGamesForDate.TryGetValue(date, out var tournamentGamesForDate);
            context.Notes.TryGetValue(date, out var notesForDate);

            yield return await _divisionFixtureDateAdapter.Adapt(
                date,
                gamesForDate,
                tournamentGamesForDate,
                notesForDate,
                context.Teams,
                token);
        }
    }

    private async IAsyncEnumerable<DivisionPlayerDto> GetPlayers(DivisionData divisionData)
    {
        foreach (var (id, score) in divisionData.Players)
        {
            if (!divisionData.PlayerIdToTeamLookup.TryGetValue(id, out var playerTuple))
            {
                playerTuple = new DivisionData.TeamPlayerTuple(
                    new TeamPlayerDto { Name = score.Player?.Name ?? "Not found" },
                    new TeamDto { Name = "Not found" });
            }

            var fixtures = divisionData.PlayersToFixtures.ContainsKey(id)
                ? divisionData.PlayersToFixtures[id]
                : new Dictionary<DateTime, Guid>();

            yield return await _divisionPlayerAdapter.Adapt(id, score, playerTuple, fixtures);
        }
    }

    private class DivisionDataContext
    {
        public IReadOnlyCollection<TeamDto> Teams { get; }
        public Dictionary<DateTime, List<FixtureDateNoteDto>> Notes { get; }
        public Dictionary<DateTime, Models.Cosmos.Game.Game[]> GamesForDate { get; }
        public Dictionary<DateTime, TournamentGame[]> TournamentGamesForDate { get; }

        public DivisionDataContext(IReadOnlyCollection<Models.Cosmos.Game.Game> games,
            IReadOnlyCollection<TeamDto> teams, IReadOnlyCollection<TournamentGame> tournamentGames,
            IReadOnlyCollection<FixtureDateNoteDto> notes)
        {
            GamesForDate = games.GroupBy(g => g.Date).ToDictionary(g => g.Key, g => g.ToArray());
            Teams = teams;
            Notes = notes.GroupBy(n => n.Date).ToDictionary(g => g.Key, g => g.ToList());
            TournamentGamesForDate = tournamentGames.GroupBy(g => g.Date).ToDictionary(g => g.Key, g => g.ToArray());
        }

        public IEnumerable<DateTime> GetDates()
        {
            return GamesForDate.Keys.Union(TournamentGamesForDate.Keys).Union(Notes.Keys);
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
