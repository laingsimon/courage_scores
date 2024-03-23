using System.Diagnostics.CodeAnalysis;

namespace TypeScriptMapper.MetaData;

[ExcludeFromCodeCoverage]
public class HelperContext
{
    public string Namespace { get; init; } = null!;
}