using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Routing;

namespace TypeScriptMapper.MetaData;

[ExcludeFromCodeCoverage]
public class TypeScriptMethod : IRouteMethod
{
    public const string FileListParameterName = "file";

    private readonly MethodInfo _method;
    private readonly IMetaDataHelper _helper;
    private readonly HelperContext _context;
    private readonly List<TypeScriptParameter> _parameters;

    public TypeScriptMethod(MethodInfo method, IMetaDataHelper helper, HelperContext context)
    {
        _method = method;
        _helper = helper;
        _context = context;
        _parameters = method.GetParameters().Select(p => new TypeScriptParameter(p, helper, _context)).ToList();
    }

    public HttpMethodAttribute? RouteAttribute => _method.GetCustomAttribute<HttpMethodAttribute>();

    public List<TypeScriptParameter> Parameters => _parameters;

    public IEnumerable<ITypeScriptType> Types => new[] { _helper.GetTypeScriptType(_context, _method.ReturnType) }.Concat(_parameters.Select(p => p.Type));

    public string Name => _method.Name.ToCamelCase();

    public string? FileUploadPropertyName => _parameters.Select(p => ParameterRequiresFileUpload(p.ParameterType)).SingleOrDefault(name => name != null);

    public string GetDefinition()
    {
        return $"{Name}({string.Join(", ", GetParameterDefinition())}): {GetReturnTypeDefinition()}";
    }

    private string GetReturnTypeDefinition()
    {
        var type = _helper.GetTypeScriptType(_context, _method.ReturnType);

        var customAttributes = _method.ReturnTypeCustomAttributes.GetCustomAttributes(false);
        var hasNullableAttribute = customAttributes.Any(a => a.ToString() == "System.Runtime.CompilerServices.NullableAttribute");

        if (hasNullableAttribute)
        {
            type = type.ToNullable();
        }

        return type.GetTypeScriptDefinition();
    }

    private IEnumerable<string> GetParameterDefinition()
    {
        foreach (var parameter in _parameters)
        {
            if (parameter.IsCancellationToken)
            {
                continue;
            }

            yield return parameter.GetDefinition();
        }

        if (FileUploadPropertyName != null)
        {
            yield return $"{FileListParameterName}: File";
        }
    }

    private static string? ParameterRequiresFileUpload(Type parameterType)
    {
        return parameterType.GetProperties().SingleOrDefault(p => p.PropertyType == typeof(IFormFile))?.Name;
    }
}