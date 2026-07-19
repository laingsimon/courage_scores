using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Division;

public interface IDivisionTournamentFixtureDetailsAdapter
{
    Task<DivisionTournamentFixtureDetailsDto> Adapt(TournamentGame tournamentGame, UserAccessContext context, CancellationToken token);
    Task<DivisionTournamentFixtureDetailsDto> ForUnselectedVenue(IEnumerable<TeamDto> teamAddress, UserAccessContext context, CancellationToken token);
}
