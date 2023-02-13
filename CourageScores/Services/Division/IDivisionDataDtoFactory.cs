using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Services.Division;

public interface IDivisionDataDtoFactory
{
    Task<DivisionDataDto> CreateDivisionDataDto(DivisionDataContext context, DivisionDto? division, CancellationToken token);
    DivisionDataDto DivisionNotFound();
    DivisionDataDto DivisionIdAndSeasonIdNotSupplied();

    Task<DivisionDataDto> SeasonNotFound(DivisionDto? division, IEnumerable<SeasonDto> allSeasons, CancellationToken token);
}