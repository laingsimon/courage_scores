using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Division;

public class DivisionDataDtoFactory : IDivisionDataDtoFactory
{
    private readonly IDivisionPlayerAdapter _divisionPlayerAdapter;
    private readonly IDivisionTeamAdapter _divisionTeamAdapter;
    private readonly IDivisionTeamDetailsAdapter _divisionTeamDetailsAdapter;
    private readonly IDivisionDataSeasonAdapter _divisionDataSeasonAdapter;
    private readonly IDivisionFixtureDateAdapter _divisionFixtureDateAdapter;

    public DivisionDataDtoFactory(
        IDivisionPlayerAdapter divisionPlayerAdapter,
        IDivisionTeamAdapter divisionTeamAdapter,
        IDivisionTeamDetailsAdapter divisionTeamDetailsAdapter,
        IDivisionDataSeasonAdapter divisionDataSeasonAdapter,
        IDivisionFixtureDateAdapter divisionFixtureDateAdapter)
    {
        _divisionPlayerAdapter = divisionPlayerAdapter;
        _divisionTeamAdapter = divisionTeamAdapter;
        _divisionTeamDetailsAdapter = divisionTeamDetailsAdapter;
        _divisionDataSeasonAdapter = divisionDataSeasonAdapter;
        _divisionFixtureDateAdapter = divisionFixtureDateAdapter;
    }

    public async Task<DivisionDataDto> CreateDivisionDataDto(DivisionDataContext context, DivisionDto? division, CancellationToken token)
    {
        var divisionData = new DivisionData();
        var gameVisitor = new DivisionDataGameVisitor(divisionData, context.Teams.ToDictionary(t => t.Id));
        foreach (var game in context.AllGames())
        {
            game.Accept(gameVisitor);
        }

        var playerResults = await GetPlayers(divisionData, token).ToList();
        var teamResults = await GetTeams(divisionData, context.Teams, playerResults, token).ToList();

        return new DivisionDataDto
        {
            Id = division?.Id ?? Guid.Empty,
            Name = division?.Name ?? "<all divisions>",
            Teams = teamResults
                .OrderByDescending(t => t.Points).ThenByDescending(t => t.Difference).ThenBy(t => t.Name).ToList(),
            AllTeams = await context.AllTeams.SelectAsync(t => _divisionTeamDetailsAdapter.Adapt(t, token)).ToList(),
            Fixtures = await GetFixtures(context, token).OrderByAsync(d => d.Date).ToList(),
            Players = ApplyPlayerRanks(playerResults
                    .OrderByDescending(p => p.Points)
                    .ThenByDescending(p => p.WinPercentage)
                    .ThenByDescending(p => p.Pairs.MatchesPlayed)
                    .ThenByDescending(p => p.Triples.MatchesPlayed)
                    .ThenBy(p => p.Name))
                .ToList(),
            Season = await _divisionDataSeasonAdapter.Adapt(context.Season, token),
            Seasons = await context.AllSeasons
                .OrderByDescending(s => s.EndDate)
                .SelectAsync(s => _divisionDataSeasonAdapter.Adapt(s, token))
                .ToList(),
            DataErrors = divisionData.DataErrors.ToList(),
        };
    }

    public async Task<DivisionDataDto> SeasonNotFound(DivisionDto? division, IEnumerable<SeasonDto> allSeasons,
        CancellationToken token)
    {
        return new DivisionDataDto
        {
            Id = division?.Id ?? Guid.Empty,
            Name = division?.Name ?? "<all divisions>",
            Seasons = await allSeasons.SelectAsync(s => _divisionDataSeasonAdapter.Adapt(s, token)).ToList(),
        };
    }

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

    private static IEnumerable<DivisionPlayerDto> ApplyPlayerRanks(IOrderedEnumerable<DivisionPlayerDto> players)
    {
        var rank = 1;
        foreach (var player in players)
        {
            player.Rank = rank++;
            yield return player;
        }
    }

    private async IAsyncEnumerable<DivisionTeamDto> GetTeams(DivisionData divisionData, IReadOnlyCollection<TeamDto> teams,
        List<DivisionPlayerDto> playerResults, [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var (id, score) in divisionData.Teams)
        {
            var team = teams.SingleOrDefault(t => t.Id == id) ?? new TeamDto { Name = "Not found", Address = "Not found" };
            var playersInTeam = playerResults.Where(p => p.Team == team.Name).ToList();

            yield return await _divisionTeamAdapter.Adapt(team, score, playersInTeam, token);
        }

        foreach (var team in teams.Where(t => !divisionData.Teams.ContainsKey(t.Id)))
        {
            yield return await _divisionTeamAdapter.WithoutFixtures(team, token);
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

    private async IAsyncEnumerable<DivisionPlayerDto> GetPlayers(DivisionData divisionData, [EnumeratorCancellation] CancellationToken token)
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

            yield return await _divisionPlayerAdapter.Adapt(score, playerTuple, fixtures, token);
        }
    }
}