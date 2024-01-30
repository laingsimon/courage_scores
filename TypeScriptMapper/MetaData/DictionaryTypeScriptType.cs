using System.Diagnostics.CodeAnalysis;

namespace TypeScriptMapper.MetaData;

[ExcludeFromCodeCoverage]
public class DictionaryTypeScriptType : ITypeScriptType
{
    private readonly ITypeScriptType _keyType;
    private readonly ITypeScriptType _valueType;

    public DictionaryTypeScriptType(ITypeScriptType keyType, ITypeScriptType valueType)
    {
        _keyType = keyType;
        _valueType = valueType;
    }

    public string GetTypeScriptDefinition()
    {
        return $"{{ [key: {_keyType.GetTypeScriptDefinition()}]: {_valueType.GetTypeScriptDefinition()} }}";
    }

    public IEnumerable<IImportableType> GetImports()
    {
        return _keyType.GetImports().Concat(_valueType.GetImports());
    }

    public ITypeScriptType ToNullable()
    {
        return new NullableTypeScriptType(this);
    }
}