namespace CourageScores.StubCosmos.Query.Tokeniser;

internal class BlockTokenBuilder : ITokenBuilder
{
    private readonly bool _rootBlock;
    private bool _blockStart;
    private bool _blockEnd;
    private readonly List<Token> _tokens = new();
    private ITokenBuilder? _tokenBuilder;

    public BlockTokenBuilder(bool rootBlock = false)
    {
        _rootBlock = rootBlock;
    }

    public bool CanAccept(char chr, TokeniserContext context)
    {
        return chr == '(' || chr == ')';
    }

    public ITokenBuilder? Accept(char chr, TokeniserContext context)
    {
        if (!_rootBlock)
        {
            if (chr == '(')
            {
                _blockStart = true;
                return this;
            }

            if (chr == ')')
            {
                _blockEnd = true;
                return null;
            }
        }

        ITokenBuilder[] knownTokens =
        [
            new QueryTokenBuilder(),
            new CommentTokenBuilder(),
            new TextTokenBuilder(),
            new OperatorTokenBuilder(),
            new BlockTokenBuilder(),
            new NumberTokenBuilder(),
        ];

        if (_tokenBuilder != null)
        {
            var newTokenBuilder = _tokenBuilder.Accept(chr, context);
            if (newTokenBuilder == null)
            {
                foreach (var token in _tokenBuilder.AsToken())
                {
                    _tokens.Add(token);
                }

                context.PreviousTokenBuilder = _tokenBuilder;
                _tokenBuilder = null;
            }
            else
            {
                _tokenBuilder = newTokenBuilder;
                return this;
            }
        }

        if (char.IsWhiteSpace(chr))
        {
            return this;
        }

        // find the token that can handle this char
        var applicableTokens = knownTokens.Where(t => t.CanAccept(chr, context)).ToArray();
        if (applicableTokens.Length == 0)
        {
            return TokeniserException.SyntaxError<ITokenBuilder>(context, $"Unable to find token that can accept first character '{chr}' in query");
        }
        if (applicableTokens.Length > 1)
        {
            var commentTokenBuilder = applicableTokens.Where(t => t is CommentTokenBuilder).ToArray();
            // could be a comment, but might not be, remove the comment token builder and try again
            var newApplicableTokens = commentTokenBuilder.Length >= 1
                ? applicableTokens.Except(commentTokenBuilder).ToArray()
                : applicableTokens;
            if (newApplicableTokens.Length > 1)
            {
                return TokeniserException.NotSupported<ITokenBuilder>(context,
                    $"Multiple tokens could handle character '{chr}' in query: {string.Join(", ", applicableTokens.Select(t => t.GetType().Name))}");
            }

            applicableTokens = newApplicableTokens;
        }

        _tokenBuilder = applicableTokens[0];
        _tokenBuilder.Accept(chr, context);
        context.PreviousTokenBuilder = _tokenBuilder;
        return this;
    }

    public IEnumerable<Token> AsToken()
    {
        try
        {
            if (_blockStart)
            {
                yield return new Token
                {
                    Type = TokenType.Block,
                    Content = "start",
                };
            }

            foreach (var token in _tokens)
            {
                yield return token;
            }

            var hasSomeContent = false;
            if (_tokenBuilder != null)
            {
                foreach (var token in _tokenBuilder.AsToken())
                {
                    hasSomeContent = true;
                    yield return token;
                }
            }

            if (_blockEnd && !_rootBlock && _blockStart && hasSomeContent)
            {
                yield return new Token
                {
                    Type = TokenType.Block,
                    Content = "end",
                };
            }
        }
        finally
        {
            _blockEnd = false;
            _blockStart = false;
            _tokenBuilder = null;
            _tokens.Clear();
        }
    }
}
