using System.Reflection;
using CourageScores.StubCosmos.Query.Tokeniser;

namespace CourageScores.StubCosmos.Query;

internal class CosmosQueryFilter<T>
{
    public required CosmosColumnReference ColumnName { get; init; }
    public required IQueryFilterOperator Operator { get; init; }
    public required Token Value { get; init; }

    public bool Matches(T row)
    {
        var prop = typeof(T).GetProperty(ColumnName.ColumnName, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
        if (prop == null)
        {
            throw new ArgumentException($"Property {ColumnName.ColumnName} not found on {typeof(T).Name}");
        }

        var value = prop.GetValue(row);
        var matcherType = typeof(GenericMatcher<>).MakeGenericType(prop.PropertyType);

        var matcher = (IMatcher)Activator.CreateInstance(matcherType, Operator)!;
        return matcher.Matches(value, Value);
    }
}

file interface IMatcher
{
    bool Matches(object? propertyValue, Token token);
}

file class GenericMatcher<TProperty>(IQueryFilterOperator @operator) : IMatcher
{
    public bool Matches(object? propertyValue, Token token)
    {
        return @operator.Matches<TProperty>(propertyValue, token);
    }
}
