using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Services.Division;

public interface IDivisionDataDtoFactory
{
    Task<DivisionDataDto> CreateDivisionDataDto(DivisionDataContext context, DivisionDto? division, bool includeProposals, CancellationToken token);
    DivisionDataDto DivisionNotFound(Guid divisionId, DivisionDto? deleted);
    DivisionDataDto DivisionIdAndSeasonIdNotSupplied(Guid? divisionId);

    Task<DivisionDataDto> SeasonNotFound(DivisionDto? division, IEnumerable<SeasonDto> allSeasons, CancellationToken token);
}