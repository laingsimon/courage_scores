using System.Collections;
using System.Reflection;
using CourageScores.StubCosmos.Query.Tokeniser;

namespace CourageScores.StubCosmos.Query;

internal class CosmosQueryOperator : IQueryFilterOperator
{
    public static readonly IQueryFilterOperator EqualTo
        = new CosmosQueryOperator((a, b) => a?.Equals(b) == true || (a == null && b == null));
    public static readonly IQueryFilterOperator GreaterThan
        = new CosmosQueryOperator((a, b) => (double?)a > (double?)b);
    public static readonly IQueryFilterOperator GreaterThanOrEqualTo
        = new CosmosQueryOperator((a, b) => (double?)a >= (double?)b);
    public static readonly IQueryFilterOperator LessThan
        = new CosmosQueryOperator((a, b) => (double?)a < (double?)b);
    public static readonly IQueryFilterOperator LessThanOrEqualTo
        = new CosmosQueryOperator((a, b) => (double?)a <= (double?)b);
    public static readonly IQueryFilterOperator In
        = new CosmosQueryOperator((a, b) => ((IEnumerable)a!).Cast<object>().Contains((IEnumerable)b!));

    private readonly Func<object?, object?, bool> _matches;

    private CosmosQueryOperator(Func<object?, object?, bool> matches)
    {
        _matches = matches;
    }

    public bool Matches<T>(object? value, Token expected)
    {
        return _matches.Invoke(value, GetValue<T>(expected));
    }

    private static object? GetValue<T>(Token token)
    {
        if (token.Content == "null")
        {
            return null;
        }

        if (typeof(T) == typeof(string))
        {
            return token.Content;
        }

        var nullableType = Nullable.GetUnderlyingType(typeof(T));
        var valueType = nullableType ?? typeof(T);

        var parseMethod = valueType.GetMethod("Parse", BindingFlags.Public | BindingFlags.Static, null, CallingConventions.Any, [typeof(string)], null);
        if (parseMethod == null)
        {
            throw new NotSupportedException($"Unsupported type (could not find a static Parse method): {typeof(T).Name} - '{token.Content}'");
        }

        return parseMethod.Invoke(null, [ token.Content ]);
    }
}
