using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Models.Adapters.Division;

public class DivisionDataSeasonAdapter : IDivisionDataSeasonAdapter
{
    public Task<DivisionDataSeasonDto> Adapt(SeasonDto season)
    {
        return Task.FromResult(new DivisionDataSeasonDto
        {
            Id = season.Id,
            Name = season.Name,
            StartDate = season.StartDate,
            EndDate = season.EndDate,
        });
    }
}