using System.Diagnostics.CodeAnalysis;

namespace CourageScores.StubCosmos.Query;

[ExcludeFromCodeCoverage]
internal class CosmosTable
{
    public required string Name { get; init; }
    public string? Alias { get; set; }
}
