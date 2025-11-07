using CourageScores.StubCosmos.Query.Tokeniser;

namespace CourageScores.StubCosmos.Query;

internal interface IQueryFilterOperator
{
    bool Matches<T>(object? value, Token expected);
}
