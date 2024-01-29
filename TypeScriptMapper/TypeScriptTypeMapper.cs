using System.Text.RegularExpressions;

namespace TypeScriptMapper;

public class TypeScriptTypeMapper
{
    public const string String = "string";
    public const string Boolean = "boolean";
    public const string Number = "number";
    public const string Object = "object";

    private static readonly HashSet<string> PrimitiveTypes = new(new[] { String, Boolean, Number, Object });

    private static readonly Dictionary<Type, string> TypeMap = new()
    {
        { typeof(bool), Boolean },
        { typeof(string), String },
        { typeof(int), Number },
        { typeof(long), Number },
        { typeof(double), Number },
        { typeof(float), Number },
        { typeof(DateTime), String },
        { typeof(DateTimeOffset), String },
        { typeof(TimeSpan), String },
        { typeof(Microsoft.AspNetCore.Http.IFormFile), String },
        { typeof(byte[]), String },
        { typeof(object), Object },
        { typeof(Guid), String },
    };

    private static readonly Dictionary<string, string> CustomMappings = new()
    {
        { "TeamPlaceholderDto", String },
    };

    public bool IsDefinedAsPrimitive(Type propertyType)
    {
        if (TypeMap.TryGetValue(propertyType, out var simpleTsType))
        {
            return PrimitiveTypes.Contains(simpleTsType);
        }

        if (CustomMappings.TryGetValue(propertyType.Name, out var customTsType))
        {
            return PrimitiveTypes.Contains(customTsType);
        }

        return false;
    }

    public bool RequiresImport(Type propertyType)
    {
        if (propertyType.IsEnum || propertyType.IsGenericParameter)
        {
            return false;
        }

        return !IsDefinedAsPrimitive(propertyType);
    }

    public string GetTypeScriptType(Type propertyType)
    {
        if (propertyType.IsEnum)
        {
            return String;
        }

        return TypeMap.GetValueOrDefault(propertyType) ?? CustomMappings.GetValueOrDefault(propertyType.Name) ?? GetTypeName(propertyType);
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