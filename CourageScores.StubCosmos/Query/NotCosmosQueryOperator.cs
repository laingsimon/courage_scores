using CourageScores.StubCosmos.Query.Tokeniser;

namespace CourageScores.StubCosmos.Query;

internal class NotCosmosQueryOperator : IQueryFilterOperator {
    private readonly IQueryFilterOperator _operator;

    public NotCosmosQueryOperator(IQueryFilterOperator @operator)
    {
        _operator = @operator;
    }

    public bool Matches<T>(object? value, Token token)
    {
        return !_operator.Matches<T>(value, token);
    }
}
