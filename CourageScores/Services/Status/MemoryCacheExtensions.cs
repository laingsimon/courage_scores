using System.Collections;
using System.Reflection;
using System.Runtime.CompilerServices;
using Microsoft.Extensions.Caching.Memory;

namespace CourageScores.Services.Status;

public static class MemoryCacheExtensions
{
    private static readonly FieldInfo? MemoryCacheEntriesField = typeof(MemoryCache).GetField("_entries", BindingFlags.Instance | BindingFlags.NonPublic);

    public static IEnumerable<object> GetKeys(this IMemoryCache cache)
    {
        var entries = MemoryCacheEntriesField?.GetValue(cache) as IDictionary;
        return entries == null
            ? Array.Empty<object>()
            : entries.Keys.Cast<object>().ToArray();
    }

    public static Dictionary<string, object?> ExposeFieldsAndProperties(this object instance)
    {
        var fields = instance.GetType().GetFields(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
        var properties = instance.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
        var exposed = new Dictionary<string, object?>();

        foreach (var field in fields.Where(f => f.GetCustomAttribute<CompilerGeneratedAttribute>() == null))
        {
            exposed[field.Name] = field.GetValue(instance);
        }

        foreach (var property in properties.Where(p => p.CanRead))
        {
            exposed[property.Name] = property.GetValue(instance);
        }

        return exposed;
    }
}
