using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Division;

public interface IDivisionTournamentFixtureDetailsAdapter
{
    Task<DivisionTournamentFixtureDetailsDto> Adapt(TournamentGame tournamentGame, CancellationToken token);
    Task<DivisionTournamentFixtureDetailsDto> ForUnselectedVenue(IEnumerable<TeamDto> teamAddress, CancellationToken token);
}