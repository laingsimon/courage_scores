namespace CourageScores.StubCosmos.Query;

internal class LogicalCosmosQueryFilter<T>
{
    public CosmosQueryFilter<T>[] And { get; init; } = [];
    public CosmosQueryFilter<T>[] Or { get; init; } = [];

    public bool Matches(T row)
    {
        var matchesAnds = And.Length == 0 || And.All(f => f.Matches(row));
        var matchesOrs = Or.Length == 0 || Or.Any(f => f.Matches(row));

        return matchesAnds && matchesOrs;
    }
}
