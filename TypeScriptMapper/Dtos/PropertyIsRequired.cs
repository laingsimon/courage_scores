using System.Diagnostics.CodeAnalysis;

namespace TypeScriptMapper.Dtos;

[ExcludeFromCodeCoverage]
[AttributeUsage(AttributeTargets.Class)]
public class PropertyIsRequired : Attribute
{
    public string[] PropertyNames { get; }

    public PropertyIsRequired(params string[] propertyNames)
    {
        PropertyNames = propertyNames;
    }
}