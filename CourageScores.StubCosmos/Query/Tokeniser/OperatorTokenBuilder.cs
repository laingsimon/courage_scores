using System.Text;

namespace CourageScores.StubCosmos.Query.Tokeniser;

internal class OperatorTokenBuilder : ITokenBuilder
{
    private readonly StringBuilder _content = new StringBuilder();

    public bool CanAccept(char chr, TokeniserContext context)
    {
        return chr == '=' || chr == '>' || chr == '<' || chr == '!';
    }

    public ITokenBuilder? Accept(char chr, TokeniserContext context)
    {
        if (char.IsWhiteSpace(chr) || char.IsLetter(chr) || char.IsDigit(chr))
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
                Type = TokenType.Operator,
            };
        }
        finally
        {
            _content.Clear();
        }
    }
}
