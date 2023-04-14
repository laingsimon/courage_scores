using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Division;

public class DivisionDataContext
{
    public IReadOnlyCollection<TeamDto> TeamsInSeason { get; }
    public IReadOnlyCollection<TeamDto> TeamsInSeasonAndDivision { get; }
    public SeasonDto Season { get; }
    public IReadOnlyCollection<SeasonDto> AllSeasons { get; }
    public Dictionary<DateTime, List<FixtureDateNoteDto>> Notes { get; }
    public Dictionary<DateTime, Models.Cosmos.Game.Game[]> GamesForDate { get; }
    public Dictionary<DateTime, TournamentGame[]> TournamentGamesForDate { get; }

    public DivisionDataContext(
        IReadOnlyCollection<Models.Cosmos.Game.Game> games,
        IReadOnlyCollection<TeamDto> teamsInSeason,
        IReadOnlyCollection<TeamDto> teamsInSeasonAndDivision,
        IReadOnlyCollection<TournamentGame> tournamentGames,
        IReadOnlyCollection<FixtureDateNoteDto> notes,
        SeasonDto season,
        IReadOnlyCollection<SeasonDto> allSeasons)
    {
        GamesForDate = games.GroupBy(g => g.Date).ToDictionary(g => g.Key, g => g.ToArray());
        TeamsInSeason = teamsInSeason;
        TeamsInSeasonAndDivision = teamsInSeasonAndDivision;
        Season = season;
        AllSeasons = allSeasons;
        Notes = notes.GroupBy(n => n.Date).ToDictionary(g => g.Key, g => g.ToList());
        TournamentGamesForDate = tournamentGames.GroupBy(g => g.Date).ToDictionary(g => g.Key, g => g.ToArray());
    }

    [ExcludeFromCodeCoverage]
    public IEnumerable<Models.Cosmos.Game.Game> AllGames()
    {
        return GamesForDate.SelectMany(pair => pair.Value);
    }

    [ExcludeFromCodeCoverage]
    public IEnumerable<TournamentGame> AllTournamentGames()
    {
        return TournamentGamesForDate.SelectMany(pair => pair.Value);
    }

    [ExcludeFromCodeCoverage]
    public IEnumerable<DateTime> GetDates()
    {
        return GamesForDate.Keys.Union(TournamentGamesForDate.Keys).Union(Notes.Keys);
    }
}