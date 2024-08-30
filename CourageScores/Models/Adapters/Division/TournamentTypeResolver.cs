using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Models.Adapters.Division;

public class TournamentTypeResolver : ITournamentTypeResolver
{
    public string GetTournamentType(TournamentGame tournamentGame)
    {
        if (!string.IsNullOrEmpty(tournamentGame.Type))
        {
            return tournamentGame.Type;
        }

        if (tournamentGame.Sides.Count >= 1)
        {
            var firstSide = tournamentGame.Sides.First();
            switch (firstSide.Players.Count)
            {
                case 1:
                    return "Singles";
                case 2:
                    return "Pairs";
            }
        }

        return "Tournament";
    }
}