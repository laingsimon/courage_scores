using System.Diagnostics.CodeAnalysis;

namespace CourageScores.StubCosmos.Query;

[ExcludeFromCodeCoverage]
internal class CosmosQuery<T>
{
    public required ColumnExpression[] SelectColumns { get; init; }
    public required CosmosTable From { get; init; }
    public LogicalCosmosQueryFilter<T>[]? Where { get; init; }
    public CosmosQueryGrouping<T>? GroupBy { get; init; }
    public CosmosQueryOrdering[]? OrderBy { get; init; }
}
