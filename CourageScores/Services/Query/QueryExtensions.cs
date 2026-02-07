using CourageScores.Common;
using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Query;

public static class QueryExtensions
{
    private static readonly string[] DateTimeFormats =
    {
        "yyyy-MM-dd",
        "dd-MM-yyyy",
        "dd-MM",
        "dd MMM",
    };

    public static IAsyncEnumerable<JToken> Filter(
        this IAsyncEnumerable<JToken> items,
        Dictionary<string, object?> filters,
        JsonSelectSettings settings,
        CancellationToken token)
    {
        if (filters.Count == 0)
        {
            return items;
        }

        return items.WhereAsync(item =>
        {
            token.ThrowIfCancellationRequested();

            return filters.All(filter =>
            {
                var (expression, value) = filter;
                var values = item.SelectTokens(expression, settings);

                return values.Any(i => ValueEquals(value, i.ToObject<object>()));
            });
        });
    }

    public static IAsyncEnumerable<JToken> SelectProperties(
        this IAsyncEnumerable<JToken> items,
        HashSet<string> columns)
    {
        return items.SelectAsync(item =>
        {
            return columns.Count == 0
                ? item
                : JObject.FromObject(columns.ToDictionary(
                    c => c,
                    item.SelectValue));
        });
    }

    private static object? SelectValue(this JToken token, string expression)
    {
        try
        {
            return token.SelectToken(expression);
        }
        catch (Exception)
        {
            return token.SelectTokens(expression);
        }
    }

    private static bool ValueEquals(object? filterValue, object? actualValue)
    {
        if (filterValue == null && actualValue == null)
        {
            return true;
        }

        if (filterValue == null || actualValue == null)
        {
            // one of the values is null, but not the other
            return false;
        }

        if (filterValue is string stringFilterValue && actualValue is DateTime actual)
        {
            return DateTimeFormats.Any(format => actual.ToString(format).Equals(stringFilterValue));
        }

        if (filterValue is string filterValueString && actualValue is string actualValueString)
        {
            return actualValueString.Equals(filterValueString, StringComparison.OrdinalIgnoreCase);
        }

        return actualValue!.ToString()!.Equals(filterValue.ToString());
    }
}
