using System.Diagnostics.CodeAnalysis;

namespace TypeScriptMapper.Controllers;

[ExcludeFromCodeCoverage]
[AttributeUsage(AttributeTargets.Method)]
public class AddHeaderAttribute : Attribute
{
    public string HeaderName { get; }
    public string ParameterName { get; }

    public AddHeaderAttribute(string headerName, string parameterName)
    {
        HeaderName = headerName;
        ParameterName = parameterName;
    }
}