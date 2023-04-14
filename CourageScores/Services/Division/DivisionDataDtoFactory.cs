using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters.Division;
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
        var gameVisitor = new DivisionDataGameVisitor(divisionData, context.TeamsInSeasonAndDivision.ToDictionary(t => t.Id));
        foreach (var game in context.AllGames())
        {
            game.Accept(gameVisitor);
        }
        foreach (var tournamentGame in context.AllTournamentGames(division))
        {
            tournamentGame.Accept(gameVisitor);
        }

        var playerResults = await GetPlayers(divisionData, context, token).ToList();
        var teamResults = await GetTeams(divisionData, context.TeamsInSeasonAndDivision, playerResults, token).ToList();
        var user = await _userService.GetUser(token);
        var canShowDataErrors = user?.Access?.ImportData == true;

        return new DivisionDataDto
        {
            Id = division?.Id ?? Guid.Empty,
            Name = division?.Name ?? "<all divisions>",
            Teams = teamResults
                .OrderByDescending(t => t.Points)
                .ThenByDescending(t => t.Difference)
                .ThenBy(t => t.Name)
                .ToList(),
            Fixtures = await GetFixtures(context, token)
                .OrderByAsync(d => d.Date)
                .ToList(),
            Players = (await AddAllPlayersIfAdmin(playerResults, user, context, token))
                .OrderByDescending(p => p.Points)
                .ThenByDescending(p => p.WinPercentage)
                .ThenByDescending(p => p.Pairs.MatchesPlayed)
                .ThenByDescending(p => p.Triples.MatchesPlayed)
                .ThenBy(p => p.Name)
                .ApplyPlayerRanks()
                .ToList(),
            Season = await _divisionDataSeasonAdapter.Adapt(context.Season, token),
            DataErrors = canShowDataErrors ? divisionData.DataErrors.ToList() : new(),
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
    public DivisionDataDto DivisionNotFound()
    {
        return new DivisionDataDto
        {
            DataErrors =
            {
                "Requested Division was not found, or has been deleted"
            }
        };
    }

    [ExcludeFromCodeCoverage]
    public DivisionDataDto DivisionIdAndSeasonIdNotSupplied()
    {
        return new DivisionDataDto
        {
            DataErrors =
            {
                "SeasonId and/or DivisionId must be supplied",
            }
        };
    }

    private async Task<IReadOnlyCollection<DivisionPlayerDto>> AddAllPlayersIfAdmin(IReadOnlyCollection<DivisionPlayerDto> players,
        UserDto? userDto,
        DivisionDataContext context,
        CancellationToken token)
    {
        var managePlayers = userDto?.Access?.ManagePlayers == true;

        if (!managePlayers)
        {
            return players;
        }

        var allPlayersInSeasonAndDivision = await context.TeamsInSeasonAndDivision
            .SelectManyAsync<TeamDto, DivisionPlayerDto>(async t =>
            {
                var teamSeason = t.Seasons.SingleOrDefault(ts => ts.SeasonId == context.Season.Id);
                if (teamSeason == null)
                {
                    return new List<DivisionPlayerDto>();
                }

                return await teamSeason.Players
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
            var teamInSeasonAndDivision = teamsInSeasonAndDivision.SingleOrDefault(t => t.Id == id) ?? new TeamDto { Name = "Not found - " + id, Address = "Not found" };
            var playersInTeam = playerResults.Where(p => p.Team == teamInSeasonAndDivision.Name).ToList();

            yield return await _divisionTeamAdapter.Adapt(teamInSeasonAndDivision, score, playersInTeam, token);
        }

        foreach (var teamInSeasonAndDivision in teamsInSeasonAndDivision.Where(t => !divisionData.Teams.ContainsKey(t.Id)))
        {
            yield return await _divisionTeamAdapter.WithoutFixtures(teamInSeasonAndDivision, token);
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
                context.TeamsInSeasonAndDivision,
                token);
        }
    }

    private async IAsyncEnumerable<DivisionPlayerDto> GetPlayers(DivisionData divisionData,
        DivisionDataContext context, [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var (id, score) in divisionData.Players)
        {
            if (!divisionData.PlayerIdToTeamLookup.TryGetValue(id, out var playerTuple))
            {
                var team = FindTeamForPlayer(id, context);
                if (team != null)
                {
                    playerTuple = new DivisionData.TeamPlayerTuple(
                        new TeamPlayerDto
                        {
                            Id = id,
                            Name = score.Player?.Name ?? "Not found",
                        },
                        team);
                }
                else
                {
                    playerTuple = new DivisionData.TeamPlayerTuple(
                        new TeamPlayerDto
                            { Name = score.Player?.Name ?? "Not found", Id = id },
                        new TeamDto { Name = "Not found - " + id });
                }
            }

            var fixtures = divisionData.PlayersToFixtures.TryGetValue(id, out var fixture)
                ? fixture
                : new Dictionary<DateTime, Guid>();

            yield return await _divisionPlayerAdapter.Adapt(score, playerTuple, fixtures, token);
        }
    }

    private TeamDto? FindTeamForPlayer(Guid id, DivisionDataContext context)
    {
        foreach (var team in context.TeamsInSeasonAndDivision)
        {
            var teamSeason = team.Seasons.SingleOrDefault(ts => ts.SeasonId == context.Season.Id);
            if (teamSeason == null)
            {
                continue;
            }

            var teamPlayer = teamSeason.Players.SingleOrDefault(p => p.Id == id);
            if (teamPlayer != null)
            {
                return team;
            }
        }

        return null;
    }
}
