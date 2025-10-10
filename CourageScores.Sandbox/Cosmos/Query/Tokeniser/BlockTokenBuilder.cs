namespace CourageScores.Sandbox.Cosmos.Query.Tokeniser;

internal class BlockTokenBuilder : ITokenBuilder
{
    private readonly bool _rootBlock;
    private bool _blockStart;
    private bool _blockEnd;
    private readonly List<Token> _tokens = new();
    private ITokenBuilder? _tokenBuilder;
    private ITokenBuilder? _lastTokenBuilder;

    public BlockTokenBuilder(bool rootBlock = false)
    {
        _rootBlock = rootBlock;
    }

    public bool CanAccept(char chr, ITokenBuilder? lastTokenBuilder)
    {
        return chr == '(' || chr == ')';
    }

    public ITokenBuilder? Accept(char chr)
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
        ];

        if (_tokenBuilder != null)
        {
            var newTokenBuilder = _tokenBuilder.Accept(chr);
            if (newTokenBuilder == null)
            {
                _tokens.AddRange(_tokenBuilder.AsToken());
                _lastTokenBuilder = _tokenBuilder;
                _tokenBuilder = null;
            }
            else
            {
                return this;
            }
        }

        if (char.IsWhiteSpace(chr))
        {
            return this;
        }

        // find the token that can handle this char
        var applicableTokens = knownTokens.Where(t => t.CanAccept(chr, _lastTokenBuilder)).ToArray();
        if (applicableTokens.Length != 1)
        {
            throw new InvalidOperationException(
                $"Unable to find token that can accept first character '{chr}' in query");
        }

        _tokenBuilder = applicableTokens[0];
        _tokenBuilder.Accept(chr);
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
            _lastTokenBuilder = null;
            _tokenBuilder = null;
            _tokens.Clear();
        }
    }
}
