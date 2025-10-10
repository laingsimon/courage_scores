using System.Diagnostics.CodeAnalysis;

namespace CourageScores.StubCosmos.Query;

[ExcludeFromCodeCoverage]
internal class ColumnExpression
{
    // e.g. *
    // e.g. column name
    // e.g. expression (1+2)
    public required string Expression { get; init; }
}
