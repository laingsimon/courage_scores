using System.Diagnostics.CodeAnalysis;

namespace TypeScriptMapper;

[ExcludeFromCodeCoverage]
public static class StringExtensions
{
    public static string ToCamelCase(this string name)
    {
        return name.Substring(0, 1).ToLower() + name.Substring(1);
    }
}