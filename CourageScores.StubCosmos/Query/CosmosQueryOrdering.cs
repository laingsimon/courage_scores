using System.Diagnostics.CodeAnalysis;

namespace CourageScores.StubCosmos.Query;

[ExcludeFromCodeCoverage]
internal class CosmosQueryOrdering
{
    public required string ColumnName { get; init; }
    public bool Descending { get; init; }
}
