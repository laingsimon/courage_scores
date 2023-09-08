using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Division;

public class DivisionFixtureDateAdapter : IDivisionFixtureDateAdapter
{
    private readonly IDivisionFixtureAdapter _divisionFixtureAdapter;
    private readonly IDivisionTournamentFixtureDetailsAdapter _divisionTournamentFixtureDetailsAdapter;
    private readonly IUserService _userService;

    public DivisionFixtureDateAdapter(
        IUserService userService,
        IDivisionFixtureAdapter divisionFixtureAdapter,
        IDivisionTournamentFixtureDetailsAdapter divisionTournamentFixtureDetailsAdapter)
    {
        _userService = userService;
        _divisionFixtureAdapter = divisionFixtureAdapter;
        _divisionTournamentFixtureDetailsAdapter = divisionTournamentFixtureDetailsAdapter;
    }

    public async Task<DivisionFixtureDateDto> Adapt(
        DateTime date,
        IReadOnlyCollection<Cosmos.Game.Game> gamesForDate,
        IReadOnlyCollection<TournamentGame> tournamentGamesForDate,
        IReadOnlyCollection<FixtureDateNoteDto> notesForDate,
        IReadOnlyCollection<TeamDto> teams,
        IReadOnlyCollection<Cosmos.Game.Game> otherFixturesForDate,
        CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        var canCreateTournaments = user?.Access?.ManageTournaments ?? false;

        return new DivisionFixtureDateDto
        {
            Date = date,
            Fixtures = (await FixturesPerDate(gamesForDate, teams, tournamentGamesForDate.Any(), otherFixturesForDate, token).ToList())
                .OrderBy(f => f.HomeTeam.Name).ToList(),
            TournamentFixtures = await TournamentFixturesPerDate(tournamentGamesForDate, teams, canCreateTournaments, gamesForDate.Count == 0, token)
                .OrderByAsync(f => f.Address).ToList(),
            Notes = notesForDate.ToList(),
        };
    }

    private async IAsyncEnumerable<DivisionFixtureDto> FixturesPerDate(
        IEnumerable<Cosmos.Game.Game> games,
        IReadOnlyCollection<TeamDto> teams,
        bool anyTournamentGamesForDate,
        IReadOnlyCollection<Cosmos.Game.Game> otherFixturesForDate,
        [EnumeratorCancellation] CancellationToken token)
    {
        var remainingTeams = teams.ToDictionary(t => t.Id);
        var hasKnockout = false;

        foreach (var game in games)
        {
            remainingTeams.Remove(game.Home.Id);
            remainingTeams.Remove(game.Away.Id);
            hasKnockout = hasKnockout || game.IsKnockout;

            yield return await _divisionFixtureAdapter.Adapt(
                game,
                teams.SingleOrDefault(t => t.Id == game.Home.Id),
                teams.SingleOrDefault(t => t.Id == game.Away.Id),
                token);
        }

        if (!anyTournamentGamesForDate)
        {
            foreach (var remainingTeam in remainingTeams.Values)
            {
                var addressInUse = otherFixturesForDate.Where(f => f.Address == remainingTeam.Address).ToArray();
                yield return await _divisionFixtureAdapter.ForUnselectedTeam(remainingTeam, hasKnockout, addressInUse, token);
            }
        }
    }

    private async IAsyncEnumerable<DivisionTournamentFixtureDetailsDto> TournamentFixturesPerDate(
        IReadOnlyCollection<TournamentGame> tournamentGames,
        IReadOnlyCollection<TeamDto> teams,
        bool canCreateGames,
        bool includePossibleVenues,
        [EnumeratorCancellation] CancellationToken token)
    {
        var addressesInUse = new HashSet<string>();

        foreach (var game in tournamentGames)
        {
            addressesInUse.Add(game.Address);
            yield return await _divisionTournamentFixtureDetailsAdapter.Adapt(game, token);
        }

        if ((tournamentGames.Any() || includePossibleVenues) && canCreateGames)
        {
            foreach (var teamAddress in teams
                         .Where(t => !addressesInUse.Contains(t.Name))
                         .GroupBy(t => t.Address)
                         .Where(g => !addressesInUse.Contains(g.Key)))
            {
                yield return await _divisionTournamentFixtureDetailsAdapter.ForUnselectedVenue(teamAddress, token);
            }
        }
    }
}