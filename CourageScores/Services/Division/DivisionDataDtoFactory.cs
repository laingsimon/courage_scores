using System.Diagnostics;
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
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Services.Division;

public class DivisionDataDtoFactory : IDivisionDataDtoFactory
{
    private readonly IDivisionDataSeasonAdapter _divisionDataSeasonAdapter;
    private readonly IDivisionFixtureDateAdapter _divisionFixtureDateAdapter;
    private readonly IDivisionPlayerAdapter _divisionPlayerAdapter;
    private readonly IDivisionTeamAdapter _divisionTeamAdapter;
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

    public async Task<DivisionDataDto> CreateDivisionDataDto(DivisionDataContext context, DivisionDto? division, bool includeProposals, CancellationToken token)
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
        var playerResults = await GetPlayers(divisionData, playerToTeamLookup, token).ToList();
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
            Fixtures = await GetFixtures(context, division?.Id, includeProposals, token)
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
            DataErrors = canShowDataErrors ? divisionData.DataErrors.ToList() : new List<DataErrorDto>(),
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
            return DataError(divisionId, $"Requested division ({deleted.Name} / {deleted.Id}) has been deleted {deleted.Deleted:d MMM yyyy HH:mm:ss})");
        }

        return DataError(divisionId, $"Requested division ({divisionId}) was not found");
    }

    [ExcludeFromCodeCoverage]
    public DivisionDataDto DivisionIdAndSeasonIdNotSupplied(Guid? divisionId)
    {
        return DataError(divisionId ?? Guid.Empty, "SeasonId and/or DivisionId must be supplied");
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
                var teamSeason = t.Seasons.SingleOrDefault(ts => ts.SeasonId == context.Season.Id && ts.Deleted == null);
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
                divisionData.DataErrors.Add(new DataErrorDto
                {
                    TeamId = id,
                    Message = $"Potential cross-division team found: {id}",
                });
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

    private async IAsyncEnumerable<DivisionFixtureDateDto> GetFixtures(DivisionDataContext context, Guid? divisionId, bool includeProposals, [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var date in context.GetDates(divisionId))
        {
            if (!context.GamesForDate.TryGetValue(date, out var gamesForDate))
            {
                gamesForDate = Array.Empty<CosmosGame>();
            }
            var tournamentGamesForDate = context.AllTournamentGames(divisionId).Where(g => g.Date == date).ToArray();
            context.Notes.TryGetValue(date, out var notesForDate);

            var inDivisionGames = gamesForDate.Where(g => ShouldShowLeagueFixture(g, divisionId, context.TeamIdToDivisionIdLookup)).ToArray();

            yield return await _divisionFixtureDateAdapter.Adapt(
                date,
                inDivisionGames,
                tournamentGamesForDate,
                notesForDate ?? Array.Empty<FixtureDateNoteDto>(),
                context.TeamsInSeasonAndDivision,
                gamesForDate.Except(inDivisionGames).ToArray(),
                includeProposals,
                token);
        }
    }

    private async IAsyncEnumerable<DivisionPlayerDto> GetPlayers(
        DivisionData divisionData,
        IReadOnlyDictionary<Guid, DivisionData.TeamPlayerTuple> playerToTeamLookup,
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

                ReportCrossDivisionalPlayer(id, score);
                continue;
            }

            var fixtures = divisionData.PlayersToFixtures.TryGetValue(id, out var fixture)
                ? fixture
                : new Dictionary<DateTime, Guid>();

            yield return await _divisionPlayerAdapter.Adapt(score, playerTuple, fixtures, token);
        }
    }

    private static bool ShouldShowLeagueFixture(CosmosGame g, Guid? divisionId, IReadOnlyDictionary<Guid, Guid?> teamIdToDivisionIdLookup)
    {
        if (divisionId == null || g.DivisionId == divisionId)
        {
            return true;
        }

        if (teamIdToDivisionIdLookup.TryGetValue(g.Home.Id, out var homeTeamDivisionId) && homeTeamDivisionId == divisionId)
        {
            return true;
        }

        if (teamIdToDivisionIdLookup.TryGetValue(g.Away.Id, out var awayTeamDivisionId) && awayTeamDivisionId == divisionId)
        {
            return true;
        }

        return false;
    }

    private static void ReportCrossDivisionalPlayer(Guid id, DivisionData.PlayerScore score)
    {
        var games = score.Games.Any()
            ? string.Join(", ", score.Games.Where(g => g != null).Select(g => $"Game: ({g!.Date:dd MMM yyy} - {g.Id})"))
            : "";
        var tournaments = score.Tournaments.Any()
            ? string.Join(", ", score.Tournaments.Where(t => t != null).Select(t => $"Tournament: ({t!.Type} on {t.Date:dd MMM yyy})"))
            : "";

        Trace.TraceWarning($"Unidentified player ({score.Player?.Name ?? id.ToString()}) from {games}{tournaments}");
    }

    [ExcludeFromCodeCoverage]
    private static DivisionDataDto DataError(Guid divisionId, string message)
    {
        return new DivisionDataDto
        {
            Id = divisionId,
            DataErrors =
            {
                new DataErrorDto
                {
                    Message = message,
                }
            },
        };
    }

    private static Dictionary<Guid, DivisionData.TeamPlayerTuple> CreatePlayerIdToTeamLookup(DivisionDataContext context)
    {
        return (from team in context.TeamsInSeasonAndDivision
            let teamSeason = team.Seasons.SingleOrDefault(ts => ts.SeasonId == context.Season.Id && ts.Deleted == null)
            where teamSeason != null
            from player in teamSeason.Players
            select new DivisionData.TeamPlayerTuple(player, team)).ToDictionary(t => t.Player.Id);
    }
}
