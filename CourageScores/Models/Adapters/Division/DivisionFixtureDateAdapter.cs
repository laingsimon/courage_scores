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
    private readonly IUserService _userService;
    private readonly IDivisionFixtureAdapter _divisionFixtureAdapter;
    private readonly IDivisionTournamentFixtureDetailsAdapter _divisionTournamentFixtureDetailsAdapter;

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
        Cosmos.Game.Game[]? gamesForDate,
        TournamentGame[]? tournamentGamesForDate,
        List<FixtureDateNoteDto>? notesForDate,
        IReadOnlyCollection<TeamDto> teams,
        CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        var canCreateGames = user?.Access?.ManageGames ?? false;

        return new DivisionFixtureDateDto
        {
            Date = date,
            Fixtures = (await FixturesPerDate(gamesForDate ?? Array.Empty<Models.Cosmos.Game.Game>(), teams, tournamentGamesForDate?.Any() ?? false).ToList())
                .OrderBy(f => f.HomeTeam.Name).ToList(),
            TournamentFixtures = await TournamentFixturesPerDate(tournamentGamesForDate ?? Array.Empty<TournamentGame>(), teams, canCreateGames, token)
                .OrderByAsync(f => f.Address).ToList(),
            HasKnockoutFixture = gamesForDate?.Any(g => g.IsKnockout) ?? false,
            Notes = notesForDate ?? new List<FixtureDateNoteDto>(),
        };
    }

    private async IAsyncEnumerable<DivisionFixtureDto> FixturesPerDate(IEnumerable<Models.Cosmos.Game.Game> games, IReadOnlyCollection<TeamDto> teams, bool anyTournamentGamesForDate)
    {
        var remainingTeams = teams.ToDictionary(t => t.Id);
        var hasKnockout = false;

        foreach (var game in games)
        {
            remainingTeams.Remove(game.Home.Id);
            remainingTeams.Remove(game.Away.Id);
            hasKnockout = hasKnockout || game.IsKnockout;

            yield return await _divisionFixtureAdapter.GameToFixture(
                game,
                teams.SingleOrDefault(t => t.Id == game.Home.Id),
                teams.SingleOrDefault(t => t.Id == game.Away.Id));
        }

        if (!anyTournamentGamesForDate)
        {
            foreach (var remainingTeam in remainingTeams.Values)
            {
                yield return await _divisionFixtureAdapter.FoUnselectedTeam(remainingTeam, hasKnockout);
            }
        }
    }

    private async IAsyncEnumerable<DivisionTournamentFixtureDetailsDto> TournamentFixturesPerDate(
        IReadOnlyCollection<TournamentGame> tournamentGames,
        IReadOnlyCollection<TeamDto> teams,
        bool canCreateGames,
        [EnumeratorCancellation] CancellationToken token)
    {
        var addressesInUse = new HashSet<string>();

        foreach (var game in tournamentGames)
        {
            addressesInUse.Add(game.Address);
            yield return await _divisionTournamentFixtureDetailsAdapter.AdaptToTournamentFixtureDto(game, token);
        }

        if (addressesInUse.Any() && canCreateGames)
        {
            foreach (var teamAddress in teams
                         .Where(t => !addressesInUse.Contains(t.Name))
                         .GroupBy(t => t.Address)
                         .Where(g => !addressesInUse.Contains(g.Key)))
            {
                yield return await _divisionTournamentFixtureDetailsAdapter.ForUnselectedVenue(teamAddress);
            }
        }
    }
}