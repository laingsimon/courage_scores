using System.Text;

namespace CourageScores.StubCosmos.Query.Tokeniser;

internal class NumberTokenBuilder : ITokenBuilder
{
    private readonly StringBuilder _content = new StringBuilder();
    private bool _hasDecimal;

    public bool CanAccept(char chr, TokeniserContext context)
    {
        return char.IsDigit(chr) || chr == '-';
    }

    public ITokenBuilder? Accept(char chr, TokeniserContext context)
    {
        if (char.IsDigit(chr) || (chr == '-' && _content.Length == 0))
        {
            _content.Append(chr);
            return this;
        }

        if (chr == '.' && _content.Length > 0 && !_hasDecimal && char.IsDigit(_content[^1]))
        {
            _hasDecimal = true;
            _content.Append(chr);
            return this;
        }

        if (chr == '-')
        {
            // single line comment
            return new CommentTokenBuilder(multiLine: false);
        }

        var isDecimal = double.TryParse(_content.ToString(), out _);
        if (!isDecimal)
        {
            return TokeniserException.SyntaxError<ITokenBuilder>(context, $"{_content} is not a valid number");
        }

        return null;
    }

    public IEnumerable<Token> AsToken()
    {
        try
        {
            yield return new Token
            {
                Content = _content.ToString(),
                Type = TokenType.Number,
            };
        }
        finally
        {
            _hasDecimal = false;
            _content.Clear();
        }
    }
}
