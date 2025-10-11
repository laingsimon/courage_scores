using System.Text;

namespace CourageScores.StubCosmos.Query.Tokeniser;

internal class TextTokenBuilder : ITokenBuilder
{
    private readonly StringBuilder _content = new StringBuilder();
    private char? _startChar;
    private char? _lastChar;
    private bool? _allowMultiLine;
    private bool _returnContent;

    public bool CanAccept(char chr, TokeniserContext context)
    {
        if (_content.Length == 0)
        {
            return chr == '\'' || chr == '"';
        }

        return true;
    }

    public ITokenBuilder? Accept(char chr, TokeniserContext context)
    {
        if (_returnContent)
        {
            if ((_lastChar == '\\' && chr == _startChar) || _lastChar == _startChar && chr == _startChar)
            {
                // this char has been escaped
                _returnContent = false;
                _content.Remove(_content.Length - 1, 1);
                _content.Append(chr);
                _lastChar = chr;
                return this;
            }

            // the string termination character (') has been hovered up, now we can return the token and let the next
            // character be consumed by the next token builder
            return null;
        }

        if ((chr == '\r' || chr == '\n') && _allowMultiLine != true)
        {
            // end of line and multi-line strings not supported
            throw new InvalidOperationException(
                "Syntax error quoted section isn't terminated before the end of the line");
        }

        if (_content.Length == 0 && _startChar == null)
        {
            _startChar = chr;
            _lastChar = chr;
            return this;
        }
        _content.Append(chr);

        if (chr == _startChar)
        {
            // if the character is escaped, it'll be handled on the next go around
            _returnContent = true;
        }

        _lastChar = chr;
        return this;
    }

    public IEnumerable<Token> AsToken()
    {
        try
        {
            var content = _content.ToString();
            if (_returnContent)
            {
                content = content.Remove(content.Length - 1, 1);
            }

            yield return new Token
            {
                Content = content,
                Type = TokenType.Text,
            };
        }
        finally
        {
            _allowMultiLine = null;
            _lastChar = null;
            _startChar = null;
            _returnContent = false;
            _content.Clear();
        }
    }
}
