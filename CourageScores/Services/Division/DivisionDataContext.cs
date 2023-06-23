using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Division;

public class DivisionDataContext
{
    private readonly IReadOnlyCollection<TournamentGame> _tournamentGames;
    public IReadOnlyCollection<TeamDto> TeamsInSeasonAndDivision { get; }
    public SeasonDto Season { get; }
    public Dictionary<DateTime, List<FixtureDateNoteDto>> Notes { get; }
    public Dictionary<DateTime, Models.Cosmos.Game.Game[]> GamesForDate { get; }

    public DivisionDataContext(
        IEnumerable<Models.Cosmos.Game.Game> games,
        IReadOnlyCollection<TeamDto> teamsInSeasonAndDivision,
        IReadOnlyCollection<TournamentGame> tournamentGames,
        IEnumerable<FixtureDateNoteDto> notes,
        SeasonDto season)
    {
        GamesForDate = games.GroupBy(g => g.Date).ToDictionary(g => g.Key, g => g.ToArray());
        TeamsInSeasonAndDivision = teamsInSeasonAndDivision;
        Season = season;
        Notes = notes.GroupBy(n => n.Date).ToDictionary(g => g.Key, g => g.ToList());
        _tournamentGames = tournamentGames;
    }

    public IEnumerable<Models.Cosmos.Game.Game> AllGames(Guid? divisionId)
    {
        return GamesForDate.SelectMany(pair => pair.Value).Where(g => divisionId == null || g.IsKnockout || g.DivisionId == divisionId);
    }

    public IEnumerable<TournamentGame> AllTournamentGames(Guid? divisionId)
    {
        return _tournamentGames
            .Where(tournament => divisionId == null || tournament.DivisionId == null || tournament.DivisionId == divisionId);
    }

    public IEnumerable<DateTime> GetDates(Guid? divisionId)
    {
        return GamesForDate.Keys.Union(AllTournamentGames(divisionId).Select(g => g.Date)).Union(Notes.Keys).OrderBy(d => d);
    }
}