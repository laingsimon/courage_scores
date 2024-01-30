using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using TypeScriptMapper.Controllers;

namespace TypeScriptMapper.MetaData;

public class TypeScriptInterfaceFactory
{
    private readonly IMetaDataHelper _helper;
    public TypeScriptInterfaceFactory(IMetaDataHelper helper)
    {
        _helper = helper;
    }

    public TypeScriptInterface Create(Type type)
    {
        var context = new HelperContext
        {
            Namespace = type.Namespace!,
        };

        return new TypeScriptInterface
        {
            DotNetType = type,
            RelativePath = _helper.GetRelativePath(context, type.Namespace!) + "/" + GetTypeName(type, false) + ".d.ts",
            Name = GetTypeName(type, true),
            Members =
                type.GetProperties(BindingFlags.Instance | BindingFlags.Public).Where(AppropriateProperty).Select(p => (ITypeScriptMember)new TypeScriptProperty(p, _helper, context))
                .Concat(type.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly).Where(AppropriateMethod).Select(m => new TypeScriptMethod(m, _helper, context)))
                .ToList(),
            GenericArguments = type.GetGenericArguments().Select(ga => new TypeScriptGenericArgument(ga, _helper, context)).ToList(),
        };
    }

    private static bool AppropriateProperty(PropertyInfo property)
    {
        if (property.ReflectedType!.GetCustomAttribute<MethodsOnlyAttribute>() != null)
        {
            return false;
        }

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
        if (type.GetGenericArguments().Any())
        {
            var name = Regex.Match(type.Name, "^(.+?)`.+$").Groups[1].Value;
            return includeGenericArguments
                ? $"{name}<{string.Join(", ", type.GetGenericArguments().Select(ga => ga.Name))}>"
                : name;
        }

        return type.Name;
    }
}