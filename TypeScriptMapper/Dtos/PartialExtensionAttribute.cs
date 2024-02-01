using System.Diagnostics.CodeAnalysis;

namespace TypeScriptMapper.Dtos;

[ExcludeFromCodeCoverage]
[AttributeUsage(AttributeTargets.Class)]
public class PartialExtensionAttribute : Attribute
{
    public string[] TypeNames { get; }

    public PartialExtensionAttribute(params string[] typeNames)
    {
        TypeNames = typeNames;
    }
}