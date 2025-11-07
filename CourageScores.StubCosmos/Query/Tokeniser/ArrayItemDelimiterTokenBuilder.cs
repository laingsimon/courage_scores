namespace CourageScores.StubCosmos.Query.Tokeniser;

internal class ArrayItemDelimiterTokenBuilder : ITokenBuilder
{
    private bool _hasDelimiter;

    public bool CanAccept(char chr, TokeniserContext context)
    {
        return chr == ',';
    }

    public ITokenBuilder? Accept(char chr, TokeniserContext context)
    {
        if (_hasDelimiter)
        {
            if (IsDelimiter(chr))
            {
                return TokeniserException.SyntaxError<ITokenBuilder>(context, "Missing item between array delimiters");
            }

            return null;
        }

        _hasDelimiter = IsDelimiter(chr);
        return this;
    }

    public IEnumerable<Token> AsToken()
    {
        try
        {
            yield return new Token
            {
                Content = ",",
                Type = TokenType.ArrayDelimiter,
            };
        }
        finally
        {
            _hasDelimiter = false;
        }
    }

    private static bool IsDelimiter(char chr)
    {
        return chr == ',';
    }
}
