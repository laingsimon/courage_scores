using System.Diagnostics.CodeAnalysis;

namespace TypeScriptMapper.MetaData;

[ExcludeFromCodeCoverage]
public class NullableTypeScriptType : ITypeScriptType
{
    private readonly ITypeScriptType _type;

    public NullableTypeScriptType(ITypeScriptType type)
    {
        _type = type;
    }

    public string GetTypeScriptDefinition()
    {
        return $"{_type.GetTypeScriptDefinition()} | null";
    }

    public IEnumerable<IImportableType> GetImports()
    {
        return _type.GetImports();
    }

    public ITypeScriptType ToNullable()
    {
        return this;
    }
}