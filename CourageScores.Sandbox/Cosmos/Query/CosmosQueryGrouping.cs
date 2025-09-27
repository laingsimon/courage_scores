namespace CourageScores.Sandbox.Cosmos.Query;

internal class CosmosQueryGrouping<T>
{
    public required string[] Columns { get; init; }
    public CosmosQueryFilter<T>? Having { get; init; }
}
