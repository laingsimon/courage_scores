namespace CourageScores.Sandbox.Cosmos.Query.Tokeniser;

internal class QueryTokeniser
{
    public IEnumerable<Token> Tokenise(string query)
    {
        if (string.IsNullOrEmpty(query))
        {
            yield break;
        }

        var blockBuilder = new BlockTokenBuilder(true);

        foreach (var chr in query)
        {
            blockBuilder.Accept(chr);
        }

        foreach (var token in blockBuilder.AsToken())
        {
            yield return token;
        }
    }
}
