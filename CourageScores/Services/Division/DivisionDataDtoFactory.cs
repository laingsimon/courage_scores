using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Division;

public class DivisionDataDtoFactory : IDivisionDataDtoFactory
{
    private readonly IDivisionPlayerAdapter _divisionPlayerAdapter;
    private readonly IDivisionTeamAdapter _divisionTeamAdapter;
    private readonly IDivisionDataSeasonAdapter _divisionDataSeasonAdapter;
    private readonly IDivisionFixtureDateAdapter _divisionFixtureDateAdapter;
    private readonly IUserService _userService;

    public DivisionDataDtoFactory(
        IDivisionPlayerAdapter divisionPlayerAdapter,
        IDivisionTeamAdapter divisionTeamAdapter,
        IDivisionDataSeasonAdapter divisionDataSeasonAdapter,
        IDivisionFixtureDateAdapter divisionFixtureDateAdapter,
        IUserService userService)
    {
        _divisionPlayerAdapter = divisionPlayerAdapter;
        _divisionTeamAdapter = divisionTeamAdapter;
        _divisionDataSeasonAdapter = divisionDataSeasonAdapter;
        _divisionFixtureDateAdapter = divisionFixtureDateAdapter;
        _userService = userService;
    }

    public async Task<DivisionDataDto> CreateDivisionDataDto(DivisionDataContext context, DivisionDto? division, CancellationToken token)
    {
        var divisionData = new DivisionData();
        var gameVisitor = new DivisionDataGameVisitor(divisionData);
        var visitorScope = new VisitorScope();
        foreach (var game in context.AllGames(division?.Id))
        {
            game.Accept(visitorScope, gameVisitor);
        }
        foreach (var tournamentGame in context.AllTournamentGames(division?.Id))
        {
            tournamentGame.Accept(visitorScope, gameVisitor);
        }

        var playerToTeamLookup = CreatePlayerIdToTeamLookup(context);
        var playerResults = await GetPlayers(divisionData, playerToTeamLookup, context, token).ToList();
        var teamResults = await GetTeams(divisionData, context.TeamsInSeasonAndDivision, playerResults, token).ToList();
        var user = await _userService.GetUser(token);
        var canShowDataErrors = user?.Access?.ImportData == true;

        return new DivisionDataDto
        {
            Id = division?.Id ?? Guid.Empty,
            Name = division?.Name ?? "<all divisions>",
            Teams = teamResults
                .OrderByDescending(t => t.FixturesWon)
                .ThenByDescending(t => t.Difference)
                .ThenBy(t => t.Name)
                .ApplyRanks()
                .ToList(),
            Fixtures = await GetFixtures(context, division?.Id, token)
                .OrderByAsync(d => d.Date)
                .ToList(),
            Players = (await AddAllPlayersIfAdmin(playerResults, user, context, token))
                .OrderByDescending(p => p.Points)
                .ThenByDescending(p => p.WinPercentage)
                .ThenByDescending(p => p.Pairs.MatchesPlayed)
                .ThenByDescending(p => p.Triples.MatchesPlayed)
                .ThenByDescending(p => p.OneEighties)
                .ThenByDescending(p => p.Over100Checkouts)
                .ThenBy(p => p.Name)
                .ApplyRanks()
                .ToList(),
            Season = await _divisionDataSeasonAdapter.Adapt(context.Season, token),
            DataErrors = canShowDataErrors ? divisionData.DataErrors.ToList() : new(),
            Updated = division?.Updated,
        };
    }

    public Task<DivisionDataDto> SeasonNotFound(DivisionDto? division, IEnumerable<SeasonDto> allSeasons,
        CancellationToken token)
    {
        return Task.FromResult(new DivisionDataDto
        {
            Id = division?.Id ?? Guid.Empty,
            Name = division?.Name ?? "<all divisions>",
        });
    }

    [ExcludeFromCodeCoverage]
    public DivisionDataDto DivisionNotFound(Guid divisionId, DivisionDto? deleted)
    {
        if (deleted != null)
        {
            return DataError($"Requested division ({deleted.Name} / {deleted.Id}) has been deleted {deleted.Deleted:d MMM yyyy HH:mm:ss})");
        }

        return DataError($"Requested division ({divisionId}) was not found");
    }

    [ExcludeFromCodeCoverage]
    public DivisionDataDto DivisionIdAndSeasonIdNotSupplied()
    {
        return DataError("SeasonId and/or DivisionId must be supplied");
    }

    private async Task<IReadOnlyCollection<DivisionPlayerDto>> AddAllPlayersIfAdmin(IReadOnlyCollection<DivisionPlayerDto> players,
        UserDto? userDto,
        DivisionDataContext context,
        CancellationToken token)
    {
        if (userDto?.Access?.ManagePlayers != true)
        {
            return players;
        }

        var allPlayersInSeasonAndDivision = await context.TeamsInSeasonAndDivision
            .SelectManyAsync<TeamDto, DivisionPlayerDto>(async t =>
            {
                var teamSeason = t.Seasons.SingleOrDefault(ts => ts.SeasonId == context.Season.Id);
                return await (teamSeason?.Players ?? new List<TeamPlayerDto>())
                    .SelectAsync(async tp => await _divisionPlayerAdapter.Adapt(t, tp, token))
                    .ToList();
            })
            .ToList();

        return players
            .UnionBy(allPlayersInSeasonAndDivision, p => p.Id)
            .ToList();
    }

    private async IAsyncEnumerable<DivisionTeamDto> GetTeams(DivisionData divisionData, IReadOnlyCollection<TeamDto> teamsInSeasonAndDivision,
        List<DivisionPlayerDto> playerResults, [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var (id, score) in divisionData.Teams)
        {
            var teamInSeasonAndDivision = teamsInSeasonAndDivision.SingleOrDefault(t => t.Id == id);
            if (teamInSeasonAndDivision == null)
            {
                divisionData.DataErrors.Add($"Potential cross-division team found: {id}");
                continue;
            }

            var playersInTeam = playerResults.Where(p => p.Team == teamInSeasonAndDivision.Name).ToList();
            yield return await _divisionTeamAdapter.Adapt(teamInSeasonAndDivision, score, playersInTeam, token);
        }

        foreach (var teamInSeasonAndDivision in teamsInSeasonAndDivision.Where(t => !divisionData.Teams.ContainsKey(t.Id)))
        {
            yield return await _divisionTeamAdapter.WithoutFixtures(teamInSeasonAndDivision, token);
        }
    }

    private async IAsyncEnumerable<DivisionFixtureDateDto> GetFixtures(DivisionDataContext context, Guid? divisionId, [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var date in context.GetDates(divisionId))
        {
            if (!context.GamesForDate.TryGetValue(date, out var gamesForDate))
            {
                gamesForDate = Array.Empty<Models.Cosmos.Game.Game>();
            }
            var tournamentGamesForDate = context.AllTournamentGames(divisionId).Where(g => g.Date == date).ToArray();
            context.Notes.TryGetValue(date, out var notesForDate);

            var inDivisionGames = gamesForDate.Where(g => divisionId == null || g.DivisionId == divisionId).ToArray();

            yield return await _divisionFixtureDateAdapter.Adapt(
                date,
                inDivisionGames,
                tournamentGamesForDate,
                notesForDate ?? Array.Empty<FixtureDateNoteDto>(),
                context.TeamsInSeasonAndDivision,
                gamesForDate.Except(inDivisionGames).ToArray(),
                token);
        }
    }

    private async IAsyncEnumerable<DivisionPlayerDto> GetPlayers(DivisionData divisionData,
        IReadOnlyDictionary<Guid, DivisionData.TeamPlayerTuple> playerToTeamLookup,
        DivisionDataContext context,
        [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var (id, score) in divisionData.Players)
        {
            if (!playerToTeamLookup.TryGetValue(id, out var playerTuple))
            {
                if (score.FromKnockout)
                {
                    // player will be represented on their own league table; should be excluded from this division
                    continue;
                }

                playerTuple = MissingTeamPlayerTuple(id, score, divisionData);
            }

            if (context.TeamsInSeasonAndDivision.All(t => t.Id != playerTuple.Team.Id))
            {
                // player may exist for another division, for example when there are cross-division knockout fixtures
                divisionData.DataErrors.Add($"Found potential cross-division player/team: {playerTuple.Player.Name}/{playerTuple.Team.Name}");
                continue;
            }

            var fixtures = divisionData.PlayersToFixtures.TryGetValue(id, out var fixture)
                ? fixture
                : new Dictionary<DateTime, Guid>();

            yield return await _divisionPlayerAdapter.Adapt(score, playerTuple, fixtures, token);
        }
    }

    private static DivisionData.TeamPlayerTuple MissingTeamPlayerTuple(Guid id, DivisionData.PlayerScore score,
        DivisionData divisionData)
    {
        var games = score.Games.Any()
            ? string.Join(", ", score.Games.Where(g => g != null).Select(g => $"Game: {g.Id} ({g.Date:dd MMM yyy})"))
            : "";
        var tournaments = score.Tournaments.Any()
            ? string.Join(", ", score.Tournaments.Where(t => t != null).Select(t => $"Tournament: {t.Id} ({t.Type} on {t.Date:dd MMM yyy})"))
            : "";

        divisionData.DataErrors.Add($"Unidentified player {id} ({score.Player?.Name ?? "<unknown>"}) {games}{tournaments}");

        return new DivisionData.TeamPlayerTuple(
            new TeamPlayerDto
            {
                Id = id,
                Name = score.Player != null
                    ? $"Invalid player {score.Player.Name} ({id})"
                    : "Player not found - " + id,
            },
            new TeamDto
            {
                Id = score.Team?.Id ?? Guid.Empty,
                Name = score.Team != null
                    ? $"Invalid team {score.Team.Name} ({score.Team.Id})"
                    : "Team not found",
            });
    }

    [ExcludeFromCodeCoverage]
    private static DivisionDataDto DataError(string message)
    {
        return new DivisionDataDto
        {
            DataErrors = { message }
        };
    }

    private static Dictionary<Guid, DivisionData.TeamPlayerTuple> CreatePlayerIdToTeamLookup(DivisionDataContext context)
    {
        return (from team in context.TeamsInSeasonAndDivision
            let teamSeason = team.Seasons.SingleOrDefault(ts => ts.SeasonId == context.Season.Id)
            where teamSeason != null
            from player in teamSeason.Players
            select new DivisionData.TeamPlayerTuple(player, team)).ToDictionary(t => t.Player.Id);
    }
}
