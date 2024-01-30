namespace TypeScriptMapper.MetaData;

public class ArrayTypeScriptType : ITypeScriptType, IImportableType
{
    private readonly ITypeScriptType _itemType;
    private readonly IImportableType? _importableType;

    public ArrayTypeScriptType(ITypeScriptType itemType)
    {
        _itemType = itemType;
        _importableType = itemType as IImportableType;
    }

    public string GetTypeScriptDefinition()
    {
        return _itemType.GetTypeScriptDefinition() + "[]";
    }

    public string Name => _importableType?.Name ?? "any[]";
    public string? RelativePath => _importableType?.RelativePath;
}