using CourageScores.Models.Cosmos;

namespace DataImport.Importers;

public static class ImportExtensions
{
    public static T? SingleOrDefaultWithError<T>(this IEnumerable<T> items, Func<T, bool> predicate)
    {
        var matching = items.Where(predicate).ToArray();
        if (matching.Length <= 1)
        {
            return matching.FirstOrDefault();
        }

        throw new InvalidOperationException(
            $"Sequence contains more than one matching element:\n{string.Join("\n", matching)}");
    }

    public static IEnumerable<T> NotDeleted<T>(this IEnumerable<T> items)
        where T : AuditedEntity
    {
        return items.Where(i => i.Deleted == null);
    }
}