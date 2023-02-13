using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Division;

public class DivisionDataContext
{
    public IReadOnlyCollection<TeamDto> AllTeams { get; }
    public IReadOnlyCollection<TeamDto> Teams { get; }
    public SeasonDto Season { get; }
    public List<SeasonDto> AllSeasons { get; }
    public Dictionary<DateTime, List<FixtureDateNoteDto>> Notes { get; }
    public Dictionary<DateTime, Models.Cosmos.Game.Game[]> GamesForDate { get; }
    public Dictionary<DateTime, TournamentGame[]> TournamentGamesForDate { get; }

    public DivisionDataContext(IReadOnlyCollection<Models.Cosmos.Game.Game> games,
        IReadOnlyCollection<TeamDto> allTeams, List<TeamDto> teams,
        IReadOnlyCollection<TournamentGame> tournamentGames,
        IReadOnlyCollection<FixtureDateNoteDto> notes, SeasonDto season, List<SeasonDto> allSeasons)
    {
        GamesForDate = games.GroupBy(g => g.Date).ToDictionary(g => g.Key, g => g.ToArray());
        AllTeams = allTeams;
        Teams = teams;
        Season = season;
        AllSeasons = allSeasons;
        Notes = notes.GroupBy(n => n.Date).ToDictionary(g => g.Key, g => g.ToList());
        TournamentGamesForDate = tournamentGames.GroupBy(g => g.Date).ToDictionary(g => g.Key, g => g.ToArray());
    }

    public IEnumerable<Models.Cosmos.Game.Game> AllGames()
    {
        return GamesForDate.SelectMany(pair => pair.Value);
    }

    public IEnumerable<DateTime> GetDates()
    {
        return GamesForDate.Keys.Union(TournamentGamesForDate.Keys).Union(Notes.Keys);
    }
}