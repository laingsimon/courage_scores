using System.Reflection;
using System.Runtime.CompilerServices;
using CourageScores.Common;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Query;

internal static class QueryExtensions
{
    public static async IAsyncEnumerable<T> EnumerateResults<T>(this FeedIterator<T> records, [EnumeratorCancellation] CancellationToken token)
    {
        while (records.HasMoreResults && !token.IsCancellationRequested)
        {
            var record = await records.ReadNextAsync(token);

            foreach (var row in record)
            {
                if (token.IsCancellationRequested)
                {
                    break;
                }

                yield return row;
            }
        }
    }

    public static IAsyncEnumerable<JToken> ExcludeCosmosProperties(this IAsyncEnumerable<JToken> items)
    {
        return items.SelectAsync(item =>
        {
            foreach (var property in item.Cast<JProperty>().ToArray())
            {
                if (property.Name.StartsWith("_"))
                {
                    property.Remove();
                }
            }

            return item;
        });
    }

    public static JObject GetError(this CosmosException exc)
    {
        var errorProperty = exc.GetType().GetProperty("Error", BindingFlags.Instance | BindingFlags.NonPublic)!;
        var error = errorProperty.GetValue(exc);

        return JObject.Parse(error!.ToString()!);
    }
}
