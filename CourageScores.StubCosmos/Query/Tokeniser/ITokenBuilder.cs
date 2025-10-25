namespace CourageScores.StubCosmos.Query.Tokeniser;

internal interface ITokenBuilder
{
    bool CanAccept(char chr, TokeniserContext context);
    ITokenBuilder? Accept(char chr, TokeniserContext context);
    IEnumerable<Token> AsToken();
}
