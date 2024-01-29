using System.Reflection;

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
            RelativePath = _helper.GetRelativePath(context, type.Namespace!) + "/" + type.Name + ".d.ts",
            Name = type.Name,
            Members =
                type.GetProperties(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly).Select(p => (ITypeScriptMember)new TypeScriptProperty(p, _helper, context))
                .Concat(type.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly).Select(m => new TypeScriptMethod(m, _helper, context)))
                .ToList(),
            GenericArguments = type.GetGenericArguments().Select(ga => new TypeScriptGenericArgument(ga, _helper, context)).ToList(),
        };
    }
}