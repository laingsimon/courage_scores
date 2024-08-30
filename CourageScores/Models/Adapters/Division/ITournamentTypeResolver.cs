using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Models.Adapters.Division;

public interface ITournamentTypeResolver
{
    string GetTournamentType(TournamentGame tournamentGame);
}