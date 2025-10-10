using System.Text;

namespace CourageScores.Sandbox.Cosmos.Query.Tokeniser;

internal class QueryTokenBuilder : ITokenBuilder
{
    private readonly StringBuilder _content = new StringBuilder();
    private bool _operand;

    public bool CanAccept(char chr, ITokenBuilder? lastTokenBuilder)
    {
        if (_content.Length == 0)
        {
            var acceptable = (chr >= 'a' && chr <= 'z') || (chr >= 'A' && chr <= 'Z') || chr == '*';
            _operand = acceptable && lastTokenBuilder is OperatorTokenBuilder;
            return acceptable;
        }

        return true;
    }

    public ITokenBuilder? Accept(char chr)
    {
        if (char.IsWhiteSpace(chr))
        {
            return null;
        }

        _content.Append(chr);
        return this;
    }

    public IEnumerable<Token> AsToken()
    {
        try
        {
            yield return new Token
            {
                Content = _content.ToString(),
                Type = _operand ? TokenType.Operand : TokenType.Query,
            };
        }
        finally
        {
            _operand = false;
            _content.Clear();
        }
    }
}
