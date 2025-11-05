namespace CourageScores.StubCosmos.Query.Tokeniser;

internal enum TokenType
{
    Comment,
    Query,
    Text,
    Operator,
    Block,
    Number,
    Array,

    // for tokeniser use only
    ArrayDelimiter,
}
