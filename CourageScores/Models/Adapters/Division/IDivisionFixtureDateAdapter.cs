using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Models.Adapters.Division;

public interface IDivisionFixtureDateAdapter
{
    Task<DivisionFixtureDateDto> Adapt(
        DateTime date,
        IReadOnlyCollection<CosmosGame> gamesForDate,
        IReadOnlyCollection<TournamentGame> tournamentGamesForDate,
        IReadOnlyCollection<FixtureDateNoteDto> notesForDate,
        IReadOnlyCollection<TeamDto> teams,
        IReadOnlyCollection<CosmosGame> otherFixturesForDate,
        bool includeProposals,
        IReadOnlyDictionary<Guid, DivisionDto?> teamIdToDivisionLookup,
        SeasonDto season,
        IReadOnlyCollection<Guid> divisionIds,
        UserAccessContext userAccessContext,
        CancellationToken token);
}
