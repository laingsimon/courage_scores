using System.Reflection;
using System.Runtime.CompilerServices;

namespace CourageScores.Services.Status;

public static class MemoryCacheExtensions
{
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
