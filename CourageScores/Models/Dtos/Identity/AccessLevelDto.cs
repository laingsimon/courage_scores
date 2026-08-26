using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Identity;

[ExcludeFromCodeCoverage]
public record AccessLevelDto(
    IReadOnlyCollection<Guid>? SeasonIds = null,
    IReadOnlyCollection<Guid>? DivisionIds = null,
    IReadOnlyCollection<Guid>? TeamIds = null)
{
    public static readonly AccessLevelDto Granted = new();
}
