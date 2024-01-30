using System.Reflection;
using Microsoft.AspNetCore.Mvc.Routing;

namespace TypeScriptMapper.MetaData;

public class TypeScriptMethod : ITypeScriptMember
{
    private readonly MethodInfo _method;
    private readonly IMetaDataHelper _helper;
    private readonly HelperContext _context;

    public TypeScriptMethod(MethodInfo method, IMetaDataHelper helper, HelperContext context)
    {
        _method = method;
        _helper = helper;
        _context = context;
        Parameters = method.GetParameters().Select(p => new TypeScriptParameter(p, helper, _context)).ToList();
    }

    public HttpMethodAttribute? RouteAttribute => _method.GetCustomAttribute<HttpMethodAttribute>();

    public bool IsExcluded => _method.GetCustomAttribute<ExcludeFromTypeScriptAttribute>() != null;

    public HashSet<ITypeScriptType> Types => new[] { _helper.GetTypeScriptType(_context, _method.ReturnType) }.Concat(Parameters.Select(p => p.Type)).ToHashSet();

    public string Name => _method.Name.ToCamelCase();

    public List<TypeScriptParameter> Parameters { get; }

    public string GetDefinition()
    {
        return $"{Name}({string.Join(", ", GetParameterDefinition())}): {GetReturnTypeDefinition()}";
    }

    private string GetReturnTypeDefinition()
    {
        return _helper.GetTypeScriptType(_context, _method.ReturnType).GetTypeScriptDefinition();
    }

    private IEnumerable<string> GetParameterDefinition()
    {
        foreach (var parameter in Parameters)
        {
            if (parameter.IsCancellationToken)
            {
                continue;
            }

            yield return parameter.GetDefinition();
        }
    }
}