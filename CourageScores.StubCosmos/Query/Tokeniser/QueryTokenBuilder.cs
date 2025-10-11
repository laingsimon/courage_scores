﻿using System.Text;

namespace CourageScores.StubCosmos.Query.Tokeniser;

internal class QueryTokenBuilder : ITokenBuilder
{
    private readonly StringBuilder _content = new StringBuilder();

    public bool CanAccept(char chr, TokeniserContext context)
    {
        if (_content.Length == 0)
        {
            return (chr >= 'a' && chr <= 'z') || (chr >= 'A' && chr <= 'Z') || chr == '*';
        }

        return true;
    }

    public ITokenBuilder? Accept(char chr, TokeniserContext context)
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
            var content = _content.ToString();
            if (content == "is" || content == "not")
            {
                yield return new Token
                {
                    Content = content,
                    Type = TokenType.Operator,
                };

                yield break;
            }

            yield return new Token
            {
                Content = content,
                Type = TokenType.Query,
            };
        }
        finally
        {
            _content.Clear();
        }
    }
}
