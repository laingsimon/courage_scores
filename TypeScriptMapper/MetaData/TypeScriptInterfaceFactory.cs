using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using TypeScriptMapper.Dtos;

namespace TypeScriptMapper.MetaData;

[ExcludeFromCodeCoverage]
public class TypeScriptInterfaceFactory
{
    private readonly IMetaDataHelper _helper;
    public TypeScriptInterfaceFactory(IMetaDataHelper helper)
    {
        _helper = helper;
    }

    public TypeScriptInterface Create(Type type, Type? from = null)
    {
        var context = new HelperContext
        {
            Namespace = (from ?? type).Namespace!,
        };

        return new TypeScriptInterface
        {
            DotNetType = type,
            RelativePath = _helper.GetRelativePath(context, type.Namespace!) + "/" + GetTypeName(type, false),
            Name = GetTypeName(type, true),
            Members =
                type.GetProperties(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly).Where(AppropriateProperty).Select(p => (ITypeScriptMember)new TypeScriptProperty(p, _helper, context))
                .Concat(type.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly).Where(AppropriateMethod).Select(m => new TypeScriptMethod(m, _helper, context)))
                .ToList(),
            GenericArguments = type.GetGenericArguments().Select(ga => new TypeScriptGenericArgument(ga, _helper, context)).ToList(),
            BaseType = type.BaseType != null && type.BaseType.Namespace?.StartsWith("CourageScores") == true
                ? Create(type.BaseType!, type)
                : null,
            Interfaces = type.GetInterfaces()
                .Where(i => i.Namespace?.StartsWith("CourageScores") == true)
                .Select(t => Create(t, type))
                .ToList(),
            PartialExtensions = type.GetCustomAttribute<PartialExtensionAttribute>()?.TypeNames.ToList() ?? new List<string>(),
        };
    }

    private static bool AppropriateProperty(PropertyInfo property)
    {
        return property.GetCustomAttribute<CompilerGeneratedAttribute>() == null
               && property.GetCustomAttribute<ExcludeFromTypeScriptAttribute>() == null;
    }

    private static bool AppropriateMethod(MethodInfo method)
    {
        return method.GetCustomAttribute<CompilerGeneratedAttribute>() == null
            && method.GetCustomAttribute<ExcludeFromTypeScriptAttribute>() == null
            && !method.Name.StartsWith("get_")
            && !method.Name.StartsWith("set_");
    }

    private static string GetTypeName(Type type, bool includeGenericArguments)
    {
        var typeName = type.Name;
        if (typeName.EndsWith("Controller"))
        {
            typeName = typeName.Replace("Controller", "Api");
            typeName = "I" + typeName;
        }

        if (type.GetGenericArguments().Any())
        {
            var name = Regex.Match(typeName, "^(.+?)`.+$").Groups[1].Value;
            return includeGenericArguments
                ? $"{name}<{string.Join(", ", type.GetGenericArguments().Select(ga => ga.Name))}>"
                : name;
        }

        return typeName;
    }
}