using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Identity;

[ExcludeFromCodeCoverage]
public record AccessLevel(
    IReadOnlyCollection<Guid>? SeasonIds = null,
    IReadOnlyCollection<Guid>? DivisionIds = null,
    IReadOnlyCollection<Guid>? TeamIds = null)
{
    public static readonly AccessLevel Granted = new();
}
