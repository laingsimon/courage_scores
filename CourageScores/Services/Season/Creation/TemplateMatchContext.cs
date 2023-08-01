using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Services.Season.Creation;

public class TemplateMatchContext
{
    public SeasonDto SeasonDto { get; }
    public List<DivisionDataDto> Divisions { get; }

    public TemplateMatchContext(SeasonDto seasonDto, IEnumerable<DivisionDataDto> divisions)
    {
        SeasonDto = seasonDto;
        Divisions = divisions.ToList();
    }
}