namespace CourageScores.StubCosmos.Query.Tokeniser;

internal record ArrayToken : Token
{
    public required IReadOnlyCollection<Token> Items { get; init; }
}
