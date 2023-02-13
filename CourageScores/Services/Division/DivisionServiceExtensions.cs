using CourageScores.Models.Dtos.Division;

namespace CourageScores.Services.Division;

public static class DivisionServiceExtensions
{
    public static IEnumerable<DivisionPlayerDto> ApplyPlayerRanks(this IOrderedEnumerable<DivisionPlayerDto> players)
    {
        var rank = 1;
        foreach (var player in players)
        {
            player.Rank = rank++;
            yield return player;
        }
    }
}