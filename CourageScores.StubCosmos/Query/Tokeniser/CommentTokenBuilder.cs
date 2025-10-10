using System.Text;

namespace CourageScores.StubCosmos.Query.Tokeniser;

internal class CommentTokenBuilder : ITokenBuilder
{
    private readonly StringBuilder _content = new StringBuilder();
    private bool? _multiLine;
    private string? _endSequence;
    private char? _firstChar;
    private bool _returnContent;

    public CommentTokenBuilder(bool? multiLine = null)
    {
        _multiLine = multiLine;
    }

    public bool CanAccept(char chr, TokeniserContext context)
    {
        if (_content.Length == 0)
        {
            return chr == '/' || chr == '-';
        }

        return true;
    }

    public ITokenBuilder? Accept(char chr, TokeniserContext context)
    {
        if (_returnContent)
        {
            // the comment terminated with the previous character
            // to prevent that character being passed to the next token builder, we hoovered it up here
            return null;
        }

        if (_content.Length == 0 && _multiLine == null)
        {
            if (_firstChar == null)
            {
                _firstChar = chr;
                return this;
            }

            if ((_firstChar == '-' && chr == '-') || (_firstChar == '/' && chr == '/'))
            {
                _multiLine = false;
                return this;
            }

            if (_firstChar == '/' && chr == '*')
            {
                _multiLine = true;
                _endSequence = "*/";
                return this;
            }

            // not a valid start to a comment
            // we have to throw because the first char has been hoovered up so cannot be re-read
            throw new InvalidOperationException($"Syntax error, '{_firstChar}{chr}' is not a valid start to a comment");
        }

        _content.Append(chr);
        if (_endSequence != null && _content.ToString().EndsWith(_endSequence))
        {
            // end of multi line comment (even if it doesn't span multiple lines)
            _returnContent = true;
            return this;
        }

        if (_multiLine == false && (chr == '\r' || chr == '\n'))
        {
            // end of (single) line (comment)
            return null;
        }

        return this;
    }

    public IEnumerable<Token> AsToken()
    {
        try
        {
            var content = _content.ToString();
            if (_endSequence != null)
            {
                content = content.Substring(0, content.Length - _endSequence.Length);
            }

            if (_multiLine == false)
            {
                content = content.TrimEnd('\r', '\n');
            }

            yield return new Token
            {
                Content = content,
                Type = TokenType.Comment,
            };
        }
        finally
        {
            _returnContent = false;
            _firstChar = null;
            _endSequence = null;
            _multiLine = null;
            _content.Clear();
        }
    }
}
