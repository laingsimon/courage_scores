using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;

namespace CourageScores.Services.Season;

public class AutoProvisionIteration
{
    public ActionResultDto<List<DivisionFixtureDateDto>> Result { get; set; } = null!;
    public List<DivisionFixtureDateDto> FixtureDates { get; set; } = null!;
}