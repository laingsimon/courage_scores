namespace CourageScores.Sandbox.Cosmos.Query.Tokeniser;

internal interface ITokenBuilder
{
    bool CanAccept(char chr, ITokenBuilder? lastTokenBuilder);
    ITokenBuilder? Accept(char chr);
    IEnumerable<Token> AsToken();
}
