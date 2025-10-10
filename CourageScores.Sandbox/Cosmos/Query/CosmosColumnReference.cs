namespace CourageScores.Sandbox.Cosmos.Query;

public class CosmosColumnReference
{
    public required string ColumnName { get; init; }
    public string? TableAlias { get; init; }
}
