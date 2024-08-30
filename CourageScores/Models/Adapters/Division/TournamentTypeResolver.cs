using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;

namespace CourageScores.Models.Adapters.Division;

public class TournamentTypeResolver : ITournamentTypeResolver
{
    public string GetTournamentType(DivisionTournamentFixtureDetailsDto tournament)
    {
        var firstSide = tournament.Sides.FirstOrDefault();
        return GetTournamentType(tournament.Type, firstSide?.Players.Count);
    }

    public string GetTournamentType(TournamentGame tournament)
    {
        var firstSide = tournament.Sides.FirstOrDefault();
        return GetTournamentType(tournament.Type, firstSide?.Players.Count);
    }

    private static string GetTournamentType(string? type, int? firstSidePlayerCount)
    {
        if (!string.IsNullOrEmpty(type))
        {
            return type;
        }

        switch (firstSidePlayerCount)
        {
            case 1:
                return "Singles";
            case 2:
                return "Pairs";
            default:
                return "Tournament";
        }
    }
}