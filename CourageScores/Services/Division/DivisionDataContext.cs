using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Services.Division;

public class DivisionDataContext
{
    private readonly IReadOnlyCollection<TournamentGame> _tournamentGames;

    public DivisionDataContext(
        IEnumerable<CosmosGame> games,
        IReadOnlyCollection<TeamDto> teamsInSeasonAndDivision,
        IReadOnlyCollection<TournamentGame> tournamentGames,
        IEnumerable<FixtureDateNoteDto> notes,
        SeasonDto season,
        IReadOnlyDictionary<Guid, Guid?> teamIdToDivisionIdLookup,
        IReadOnlyDictionary<Guid, DivisionDto> divisions,
        DivisionDataFilter filter)
    {
        GamesForDate = games.GroupBy(g => g.Date).ToDictionary(g => g.Key, g => g.ToArray());
        TeamsInSeasonAndDivision = teamsInSeasonAndDivision;
        Season = season;
        TeamIdToDivisionIdLookup = teamIdToDivisionIdLookup;
        Notes = notes.GroupBy(n => n.Date).ToDictionary(g => g.Key, g => g.ToArray());
        _tournamentGames = tournamentGames;
        Divisions = divisions;
        Filter = filter;
    }

    public IReadOnlyCollection<TeamDto> TeamsInSeasonAndDivision { get; }
    public SeasonDto Season { get; }
    public IReadOnlyDictionary<Guid, Guid?> TeamIdToDivisionIdLookup { get; }
    public Dictionary<DateTime, FixtureDateNoteDto[]> Notes { get; }
    public Dictionary<DateTime, CosmosGame[]> GamesForDate { get; }
    public IReadOnlyDictionary<Guid, DivisionDto> Divisions { get; }
    public DivisionDataFilter Filter { get; }

    public IEnumerable<CosmosGame> AllGames(Guid? divisionId)
    {
        return GamesForDate.SelectMany(pair => pair.Value).Where(g => divisionId == null || g.IsKnockout || g.DivisionId == divisionId);
    }

    public IEnumerable<TournamentGame> AllTournamentGames(IReadOnlyCollection<Guid> divisionIds)
    {
        var anyDivision = divisionIds.Count == 0;

        return _tournamentGames
            .Where(tournament => anyDivision || tournament.DivisionId == null || divisionIds.Contains(tournament.DivisionId.Value));
    }

    public IEnumerable<DateTime> GetDates(IReadOnlyCollection<Guid> divisionIds)
    {
        return GamesForDate.Keys
            .Union(AllTournamentGames(divisionIds).Select(g => g.Date))
            .Union(Notes.Keys)
            .OrderBy(d => d);
    }
}