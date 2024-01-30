using System.Collections;
using Microsoft.AspNetCore.Mvc;

namespace TypeScriptMapper.MetaData;

public class MetaDataHelper : IMetaDataHelper
{
    private static readonly ITypeScriptType Any = new TypeScriptType
    {
        RelativePath = null,
        IsPrimitive = true,
        Name = "any",
    };

    private const string String = "string";
    private const string Boolean = "boolean";
    private const string Number = "number";
    private const string Object = "object";

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

    public ITypeScriptType GetTypeScriptType(HelperContext context, Type type)
    {
        var isPrimitive = TypeMap.TryGetValue(type, out var primitiveTypeName);
        var isCustomPrimitive = CustomMappings.TryGetValue(type.Name, out var customPrimitiveTypeName);
        var isDotnetNativeType = type.Namespace?.StartsWith("System.") == true || type.Namespace?.StartsWith("Microsoft.") == true;

        if (type == typeof(RedirectResult))
        {
            return Any;
        }

        if (type == typeof(IActionResult))
        {
            return new PromiseTypeScriptType(Any);
        }

        if (type.GetGenericArguments().Any())
        {
            if (type.IsAssignableTo(typeof(IEnumerable)))
            {
                var itemType = type.GetGenericArguments()[0];
                var itemTypeScriptType = GetTypeScriptType(context, itemType);
                return new ArrayTypeScriptType(itemTypeScriptType);
            }

            if (type.Name.StartsWith("IAsyncEnumerable"))
            {
                var itemType = type.GetGenericArguments()[0];
                var itemTypeScriptType = GetTypeScriptType(context, itemType);
                return new PromiseTypeScriptType(new ArrayTypeScriptType(itemTypeScriptType));
            }

            if (type.IsAssignableTo(typeof(Task)))
            {
                var itemType = type.GetGenericArguments()[0];
                var taskType = GetTypeScriptType(context, itemType);
                return new PromiseTypeScriptType(taskType);
            }

            if (Nullable.GetUnderlyingType(type) != null)
            {
                return GetTypeScriptType(context, Nullable.GetUnderlyingType(type)!);
            }

            ITypeScriptType outerType;
            if (type.Name.StartsWith("ActionResultDto") && type.Namespace == "CourageScores.Models.Dtos")
            {
                outerType = new TypeScriptType
                {
                    DotNetType = type,
                    Name = "IClientActionResultDto",
                    IsPrimitive = false,
                    RelativePath = GetPathToRoot(context) + "/IClientActionResultDto.ts",
                };
            }
            else
            {
                outerType = new TypeScriptType
                {
                    DotNetType = type,
                    Name = type.Name,
                    IsPrimitive = false,
                    RelativePath = GetRelativePath(context, type.Namespace!) + "/I" + type.Name + ".d.ts",
                };
            }

            return new GenericTypeScriptType
            {
                OuterType = outerType,
                GenericTypes = type.GetGenericArguments().Select(ga => GetTypeScriptType(context, ga)).ToList(),
            };
        }

        return new TypeScriptType
        {
            DotNetType = type,
            Name = primitiveTypeName ?? customPrimitiveTypeName ?? "I" + type.Name,
            IsPrimitive = isPrimitive || isCustomPrimitive || isDotnetNativeType,
            RelativePath = isPrimitive || isCustomPrimitive || isDotnetNativeType
                ? null
                : GetRelativePath(context, type.Namespace!) + "/I" + type.Name + ".d.ts",
        };
    }

    private string GetPathToRoot(HelperContext context)
    {
        const string rootNamespace = "CourageScores";
        var relativeContextualNamespace = context.Namespace.Replace(rootNamespace, "");

        return string.Join("/", Enumerable.Range(0, relativeContextualNamespace.Count(c => c == '.')).Select(_ => ".."));
    }

    public string GetRelativePath(HelperContext context, string ns)
    {
        const string rootNamespace = "CourageScores";
        var relativeNamespace = ns.Replace(rootNamespace, "");
        relativeNamespace = relativeNamespace.Replace("Dtos", "dtos");
        relativeNamespace = relativeNamespace.Replace("Models", "models");
        relativeNamespace = relativeNamespace.Replace("Controllers", "apis");

        return GetPathToRoot(context) + relativeNamespace.Replace(".", "/");
    }
}