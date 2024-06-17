using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Services.Division;

public interface IDivisionDataDtoFactory
{
    Task<DivisionDataDto> CreateDivisionDataDto(DivisionDataContext context, IReadOnlyCollection<DivisionDto?> divisions, bool includeProposals, CancellationToken token);
    DivisionDataDto DivisionNotFound(IReadOnlyCollection<Guid> divisionIds, IReadOnlyCollection<DivisionDto> deletedDivisions);
    DivisionDataDto DivisionIdAndSeasonIdNotSupplied(Guid? divisionId);

    Task<DivisionDataDto> SeasonNotFound(IReadOnlyCollection<DivisionDto?> divisions, IEnumerable<SeasonDto> allSeasons, CancellationToken token);
}