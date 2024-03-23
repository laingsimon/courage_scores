using System.Collections;
using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;

namespace TypeScriptMapper.MetaData;

[ExcludeFromCodeCoverage]
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
        { typeof(Type), String },
    };

    private static readonly Dictionary<string, string> CustomMappings = new()
    {
        { "TeamPlaceholderDto", String },
    };

    public ITypeScriptType GetTypeScriptType(HelperContext context, Type type)
    {
        if (type.IsGenericTypeParameter)
        {
            return new TypeScriptType
            {
                DotNetType = type,
                Name = type.Name,
                IsPrimitive = true,
                RelativePath = null,
            };
        }

        if (type == typeof(RedirectResult))
        {
            return Any;
        }

        if (type == typeof(IActionResult))
        {
            return new PromiseTypeScriptType(Any);
        }

        if (type.IsEnum)
        {
            type = typeof(string); //enums are serialized as strings
        }
        if (type == typeof(byte[]))
        {
            type = typeof(string); // base64 encoded data
        }

        if (type.GetGenericArguments().Any())
        {
            if (type.IsAssignableTo(typeof(IDictionary)) && type.GetGenericArguments().Length == 2)
            {
                return new DictionaryTypeScriptType(
                    GetTypeScriptType(context, type.GetGenericArguments()[0]),
                    GetTypeScriptType(context, type.GetGenericArguments()[1]));
            }

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
                    RelativePath = GetPathToRoot(context) + "/../components/common/IClientActionResultDto",
                };
            }
            else
            {
                outerType = new TypeScriptType
                {
                    DotNetType = type,
                    Name = type.Name,
                    IsPrimitive = false,
                    RelativePath = GetRelativePath(context, type.Namespace!) + "/I" + type.Name,
                };
            }

            return new GenericTypeScriptType
            {
                OuterType = outerType,
                GenericTypes = type.GetGenericArguments().Select(ga => GetTypeScriptType(context, ga)).ToList(),
            };
        }

        if (type.IsAssignableTo(typeof(Task)))
        {
            return new PromiseTypeScriptType(new TypeScriptType
            {
                IsPrimitive = true,
                Name = "void",
            });
        }

        if (type.IsAssignableTo(typeof(IEnumerable)) && type != typeof(string))
        {
            var elementType = type.GetElementType();

            if (elementType != null)
            {
                return new ArrayTypeScriptType(GetTypeScriptType(context, elementType));
            }
        }

        var isPrimitive = TypeMap.TryGetValue(type, out var primitiveTypeName);
        var isCustomPrimitive = CustomMappings.TryGetValue(type.Name, out var customPrimitiveTypeName);
        var isDotnetNativeType = type.Namespace?.StartsWith("System.") == true || type.Namespace?.StartsWith("Microsoft.") == true;

        return new TypeScriptType
        {
            DotNetType = type,
            Name = primitiveTypeName ?? customPrimitiveTypeName ?? GetTypeName(type),
            IsPrimitive = isPrimitive || isCustomPrimitive || isDotnetNativeType,
            RelativePath = isPrimitive || isCustomPrimitive || isDotnetNativeType
                ? null
                : GetRelativePath(context, type.Namespace!) + "/" + type.Name,
        };
    }

    public string GetRelativePath(HelperContext context, string ns)
    {
        var contextNamespaces = context.Namespace.Split('.').ToList();
        var relativeNamespaces = ns.Split('.').ToList();
        var navigation = new List<string>();

        while (contextNamespaces.Any() && relativeNamespaces.Any() && contextNamespaces.First() == relativeNamespaces.First())
        {
            contextNamespaces.RemoveAt(0);
            relativeNamespaces.RemoveAt(0);
        }

        if (!contextNamespaces.Any() && !relativeNamespaces.Any())
        {
            return ".";
        }

        var prefixWithCurrentDirectory = true;
        while (contextNamespaces.Any())
        {
            prefixWithCurrentDirectory = false;
            navigation.Add("..");
            contextNamespaces.RemoveAt(0);
        }
        while (relativeNamespaces.Any())
        {
            var nsToAdd = relativeNamespaces[0];
            nsToAdd = nsToAdd.Replace("Dtos", "dtos");
            nsToAdd = nsToAdd.Replace("Models", "models");
            nsToAdd = nsToAdd.Replace("Controllers", "apis");

            navigation.Add(nsToAdd);
            relativeNamespaces.RemoveAt(0);
        }

        return (prefixWithCurrentDirectory ? "./" : "") + string.Join("/", navigation);
    }

    private static string GetTypeName(Type type)
    {
        if (type.GetGenericArguments().Any())
        {
            return Regex.Match(type.Name, "^(.+?)`.+$").Groups[1].Value;
        }

        return type.Name;
    }

    private static string GetPathToRoot(HelperContext context)
    {
        const string rootNamespace = "CourageScores";
        var relativeContextualNamespace = context.Namespace.Replace(rootNamespace, "");

        return string.Join("/", Enumerable.Range(0, relativeContextualNamespace.Count(c => c == '.')).Select(_ => ".."));
    }
}