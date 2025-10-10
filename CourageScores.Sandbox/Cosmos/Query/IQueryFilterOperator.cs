using CourageScores.Sandbox.Cosmos.Query.Tokeniser;

namespace CourageScores.Sandbox.Cosmos.Query;

internal interface IQueryFilterOperator
{
    bool Matches<T>(object? value, Token expected);
}
