namespace CourageScores.StubCosmos.Query.Tokeniser;

internal class QueryTokeniser
{
    public IEnumerable<Token> Tokenise(string query)
    {
        query = query.Replace("\r", "");
        if (string.IsNullOrEmpty(query))
        {
            yield break;
        }

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

        Token? lastToken = null;
        foreach (var token in blockBuilder.AsToken())
        {
            var thisToken = lastToken?.Type == TokenType.Operator && token.Type != TokenType.Operator
                ? token with { Type = TokenType.Operand }
                : token;
            yield return thisToken;
            lastToken = thisToken;
        }
    }
}
