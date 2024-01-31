using System.Diagnostics.CodeAnalysis;

namespace TypeScriptMapper.Dtos;

[ExcludeFromCodeCoverage]
[AttributeUsage(AttributeTargets.Class)]
public class PropertyIsOptional : Attribute
{
    public string[] PropertyNames { get; }

    public PropertyIsOptional(params string[] propertyNames)
    {
        PropertyNames = propertyNames;
    }
}