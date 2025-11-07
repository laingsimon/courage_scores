namespace CourageScores.StubCosmos.Query.Tokeniser;

internal class QueryTokeniser
{
    public IEnumerable<Token> Tokenise(string query)
    {
        var blockBuilder = new BlockTokenBuilder(true);
        var context = new TokeniserContext();

        foreach (var chr in query)
        {
            if (chr == '\n')
            {
                context.ColumnNumber = 1;
                context.LineNumber++;
            }
            else
            {
                context.ColumnNumber++;
            }

            blockBuilder.Accept(chr, context);
        }

        foreach (var token in blockBuilder.AsToken())
        {
            yield return token;
        }
    }
}
