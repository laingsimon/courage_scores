using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Models.Adapters.Division;

public interface IDivisionDataSeasonAdapter
{
    Task<DivisionDataSeasonDto> Adapt(SeasonDto season, CancellationToken token);
}