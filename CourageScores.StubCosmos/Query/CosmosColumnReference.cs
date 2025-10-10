using System.Diagnostics.CodeAnalysis;

namespace CourageScores.StubCosmos.Query;

[ExcludeFromCodeCoverage]
internal class CosmosColumnReference
{
    public required string ColumnName { get; init; }
    public string? TableAlias { get; init; }
}
