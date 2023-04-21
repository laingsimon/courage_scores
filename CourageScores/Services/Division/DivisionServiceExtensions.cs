using CourageScores.Models.Dtos.Division;

namespace CourageScores.Services.Division;

public static class DivisionServiceExtensions
{
    public static IEnumerable<T> ApplyRanks<T>(this IOrderedEnumerable<T> dtos)
        where T : class, IRankedDto
    {
        var rank = 1;
        foreach (var dto in dtos)
        {
            dto.Rank = rank++;
            yield return dto;
        }
    }
}