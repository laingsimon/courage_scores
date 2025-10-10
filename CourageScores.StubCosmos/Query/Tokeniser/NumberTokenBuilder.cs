using System.Text;

namespace CourageScores.StubCosmos.Query.Tokeniser;

internal class NumberTokenBuilder : ITokenBuilder
{
    private readonly StringBuilder _content = new StringBuilder();
    private bool _hasDecimal;
    private bool _isSingleLineComment;

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

        if (chr == '.' && _content.Length > 0 && !_hasDecimal)
        {
            _hasDecimal = true;
            _content.Append(chr);
            return this;
        }

        if (chr == '-')
        {
            // single line comment
            _isSingleLineComment = true;
            return new CommentTokenBuilder(multiLine: false);
        }

        return null;
    }

    public IEnumerable<Token> AsToken()
    {
        try
        {
            if (_isSingleLineComment)
            {
                yield break;
            }

            yield return new Token
            {
                Content = _content.ToString(),
                Type = TokenType.Number,
            };
        }
        finally
        {
            _hasDecimal = false;
            _isSingleLineComment = false;
            _content.Clear();
        }
    }
}
