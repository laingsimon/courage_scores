using System.Diagnostics.CodeAnalysis;

namespace CourageScores.StubCosmos.Query;

[ExcludeFromCodeCoverage]
internal class CosmosQueryGrouping<T>
{
    public required string[] Columns { get; init; }
    public CosmosQueryFilter<T>? Having { get; init; }
}
