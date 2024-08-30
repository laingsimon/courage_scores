using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;

namespace CourageScores.Models.Adapters.Division;

public interface ITournamentTypeResolver
{
    string GetTournamentType(TournamentGame tournament);
    string GetTournamentType(DivisionTournamentFixtureDetailsDto tournament);
}