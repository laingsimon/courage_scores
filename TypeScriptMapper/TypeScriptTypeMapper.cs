using System.Text.RegularExpressions;
using CourageScores.Models.Dtos.Season.Creation;
using Microsoft.AspNetCore.Http;

namespace TypeScriptMapper;

public class TypeScriptTypeMapper
{
    private static readonly Dictionary<Type, string> TypeMap = new()
    {
        { typeof(bool), "boolean" },
        { typeof(string), "string" },
        { typeof(int), "number" },
        { typeof(long), "number" },
        { typeof(double), "number" },
        { typeof(float), "number" },
        { typeof(DateTime), "string" },
        { typeof(DateTimeOffset), "string" },
        { typeof(TimeSpan), "string" },
        { typeof(IFormFile), "string" },
        { typeof(byte[]), "string" },
        { typeof(object), "object" },
        { typeof(Guid), "string" },
        // types with custom converters
        { typeof(TeamPlaceholderDto), "string" },
    };

    public bool IsDefinedAsPrimitive(Type propertyType)
    {
        return TypeMap.ContainsKey(propertyType);
    }

    public bool RequiresImport(Type propertyType)
    {
        return !propertyType.IsEnum && !TypeMap.ContainsKey(propertyType) && !propertyType.IsGenericParameter;
    }

    public string GetTypeScriptType(Type propertyType)
    {
        if (propertyType.IsEnum)
        {
            return "string";
        }

        return TypeMap.GetValueOrDefault(propertyType, GetTypeName(propertyType));
    }

    private static string GetTypeName(Type propertyType)
    {
        var type = propertyType;
        if (type.GetGenericArguments().Any())
        {
            return "I" + Regex.Match(type.Name, "^(.+?)`.+$").Groups[1].Value;
        }

        return "I" + type.Name;
    }
}