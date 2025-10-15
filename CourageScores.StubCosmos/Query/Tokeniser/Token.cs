using System.Diagnostics.CodeAnalysis;

namespace CourageScores.StubCosmos.Query.Tokeniser;

[ExcludeFromCodeCoverage]
internal record Token
{
    public required string Content { get; init; }
    public TokenType Type { get; init; }
}
