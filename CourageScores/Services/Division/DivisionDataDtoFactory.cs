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

    public async Task<DivisionDataDto> CreateDivisionDataDto(DivisionDataContext context, IReadOnlyCollection<DivisionDto?> divisions, bool includeProposals, CancellationToken token)
    {
        var divisionData = new DivisionData();
        var gameVisitor = new DivisionDataGameVisitor(divisionData);
        var visitorScope = new VisitorScope();
        foreach (var division in divisions)
        {
            foreach (var game in context.AllGames(division?.Id))
            {
                game.Accept(visitorScope, gameVisitor);
            }
        }
        foreach (var tournamentGame in context.AllTournamentGames(divisions.Where(d => d != null).Select(d => d!.Id).ToArray()))
        {
            tournamentGame.Accept(visitorScope, gameVisitor);
        }

        var playerToTeamLookup = CreatePlayerIdToTeamLookup(context);
        var playerResults = await GetPlayers(divisionData, playerToTeamLookup, context, token).ToList();
        var teamResults = await GetTeams(divisionData, context, playerResults, token).ToList();
        var user = await _userService.GetUser(token);
        var canShowDataErrors = user?.Access?.ImportData == true;

        return new DivisionDataDto
        {
            Id = (divisions.Count == 1 ? divisions.ElementAt(0)?.Id : null) ?? Guid.Empty,
            Name = GetDivisionName(divisions),
            Teams = teamResults
                .OrderByDescending(t => t.FixturesWon)
                .ThenByDescending(t => t.Difference)
                .ThenBy(t => t.Name)
                .ApplyRanks()
                .ToList(),
            Fixtures = await GetFixtures(context, divisions, includeProposals, token)
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
            Updated = divisions.Count == 1 ? divisions.ElementAt(0)?.Updated : null,
        };
    }

    public Task<DivisionDataDto> SeasonNotFound(IReadOnlyCollection<DivisionDto?> divisions, IEnumerable<SeasonDto> allSeasons,
        CancellationToken token)
    {
        return Task.FromResult(new DivisionDataDto
        {
            Id = (divisions.Count == 1 ? divisions.ElementAt(0)?.Id : null) ?? Guid.Empty,
            Name = (divisions.Count == 1 ? divisions.ElementAt(0)?.Name ?? "<unnamed division>" : null) ?? "<all divisions>",
        });
    }

    [ExcludeFromCodeCoverage]
    public DivisionDataDto DivisionNotFound(IReadOnlyCollection<Guid> divisionIds, IReadOnlyCollection<DivisionDto> deletedDivisions)
    {
        return new DivisionDataDto
        {
            Id = divisionIds.Count == 1 ? divisionIds.ElementAt(0) : Guid.Empty,
            DataErrors =
            {
                new DataErrorDto
                {
                    Message = string.Join(", ", divisionIds.Select(divisionId =>
                    {
                        var deleted = deletedDivisions.SingleOrDefault(d => d.Id == divisionId);
                        return deleted != null
                            ? $"Requested division ({deleted.Name} / {deleted.Id}) has been deleted {deleted.Deleted:d MMM yyyy HH:mm:ss})"
                            : $"Requested division ({divisionId}) was not found";
                    })),
                }
            },
        };
    }

    [ExcludeFromCodeCoverage]
    public DivisionDataDto DivisionIdAndSeasonIdNotSupplied(Guid? divisionId)
    {
        return DataError(divisionId ?? Guid.Empty, "SeasonId and/or DivisionId must be supplied");
    }

    private static string GetDivisionName(IReadOnlyCollection<DivisionDto?> divisions)
    {
        switch (divisions.Count)
        {
            case 0:
                return "<0 divisions>";
            case 1:
                return divisions.ElementAt(0)?.Name ?? "<unnamed division>";
            default:
                return string.Join(" & ", divisions.OrderBy(d => d?.Name).Select(d => d?.Name ?? "<unnamed division>"));
        }
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
                var division = teamSeason != null
                    ? context.Divisions.GetValueOrDefault(teamSeason.DivisionId)
                    : null;
                return await (teamSeason?.Players ?? new List<TeamPlayerDto>())
                    .SelectAsync(async tp => await _divisionPlayerAdapter.Adapt(t, tp, division, token))
                    .ToList();
            })
            .ToList();

        return players
            .UnionBy(allPlayersInSeasonAndDivision, p => p.Id)
            .ToList();
    }

    private async IAsyncEnumerable<DivisionTeamDto> GetTeams(DivisionData divisionData, DivisionDataContext context,
        IReadOnlyCollection<DivisionPlayerDto> playerResults, [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var (id, score) in divisionData.Teams)
        {
            var teamInSeasonAndDivision = context.TeamsInSeasonAndDivision.SingleOrDefault(t => t.Id == id);
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
            var division = GetDivisionDtoForTeamId(context, teamInSeasonAndDivision.Id);
            yield return await _divisionTeamAdapter.Adapt(teamInSeasonAndDivision, score, playersInTeam, division, token);
        }

        foreach (var teamInSeasonAndDivision in context.TeamsInSeasonAndDivision.Where(t => !divisionData.Teams.ContainsKey(t.Id)))
        {
            var division = GetDivisionDtoForTeamId(context, teamInSeasonAndDivision.Id);
            yield return await _divisionTeamAdapter.WithoutFixtures(teamInSeasonAndDivision, division, token);
        }
    }

    private static DivisionDto? GetDivisionDtoForTeamId(DivisionDataContext context, Guid teamId)
    {
        if (!context.TeamIdToDivisionIdLookup.TryGetValue(teamId, out var divisionId) || divisionId == null)
        {
            return null;
        }

        return context.Divisions.GetValueOrDefault(divisionId.Value);
    }

    private async IAsyncEnumerable<DivisionFixtureDateDto> GetFixtures(DivisionDataContext context, IReadOnlyCollection<DivisionDto?> divisions, bool includeProposals, [EnumeratorCancellation] CancellationToken token)
    {
        var divisionIds = divisions.Select(d => d?.Id).Where(id => id != null).ToArray(); // should NOT contain null, an empty list means return all divisional data
        var divisionLookup = divisions.Where(d => d != null).ToDictionary(d => d!.Id);
        var teamIdToDivisionLookup = context.TeamIdToDivisionIdLookup.ToDictionary(
            pair => pair.Key,
            pair => pair.Value == null
                ? null
                : divisionLookup.GetValueOrDefault(pair.Value.Value));

        foreach (var date in context.GetDates(divisionLookup.Keys))
        {
            if (!context.GamesForDate.TryGetValue(date, out var gamesForDate))
            {
                gamesForDate = Array.Empty<CosmosGame>();
            }
            var tournamentGamesForDate = context.AllTournamentGames(divisionLookup.Keys).Where(g => g.Date == date).ToArray();
            context.Notes.TryGetValue(date, out var notesForDate);

            var inDivisionGames = gamesForDate.Where(g => ShouldShowLeagueFixture(g, divisionIds, context.TeamIdToDivisionIdLookup)).ToArray();

            yield return await _divisionFixtureDateAdapter.Adapt(
                date,
                inDivisionGames,
                tournamentGamesForDate,
                notesForDate ?? Array.Empty<FixtureDateNoteDto>(),
                context.TeamsInSeasonAndDivision,
                gamesForDate.Except(inDivisionGames).ToArray(),
                includeProposals,
                teamIdToDivisionLookup,
                token);
        }
    }

    private async IAsyncEnumerable<DivisionPlayerDto> GetPlayers(
        DivisionData divisionData,
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

                ReportCrossDivisionalPlayer(id, score);
                continue;
            }

            var fixtures = divisionData.PlayersToFixtures.TryGetValue(id, out var fixture)
                ? fixture
                : new Dictionary<DateTime, Guid>();

            var division = GetDivisionDtoForTeamId(context, playerTuple.Team.Id);
            yield return await _divisionPlayerAdapter.Adapt(score, playerTuple, fixtures, division, token);
        }
    }

    private static bool ShouldShowLeagueFixture(CosmosGame g, IReadOnlyCollection<Guid?> divisionIds, IReadOnlyDictionary<Guid, Guid?> teamIdToDivisionIdLookup)
    {
        if (!divisionIds.Any() || divisionIds.Contains(g.DivisionId))
        {
            return true;
        }

        if (teamIdToDivisionIdLookup.TryGetValue(g.Home.Id, out var homeTeamDivisionId) && divisionIds.Contains(homeTeamDivisionId))
        {
            return true;
        }

        if (teamIdToDivisionIdLookup.TryGetValue(g.Away.Id, out var awayTeamDivisionId) && divisionIds.Contains(awayTeamDivisionId))
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
