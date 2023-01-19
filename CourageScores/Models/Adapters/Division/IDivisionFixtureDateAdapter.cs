using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Division;

public interface IDivisionFixtureDateAdapter
{
    Task<DivisionFixtureDateDto> Adapt(
        DateTime date,
        Cosmos.Game.Game[]? gamesForDate,
        TournamentGame[]? tournamentGamesForDate,
        List<FixtureDateNoteDto>? notesForDate,
        IReadOnlyCollection<TeamDto> teams,
        CancellationToken token);
}