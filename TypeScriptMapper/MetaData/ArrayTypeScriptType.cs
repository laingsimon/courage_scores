namespace TypeScriptMapper.MetaData;

public class ArrayTypeScriptType : ITypeScriptType
{
    private readonly ITypeScriptType _itemType;

    public ArrayTypeScriptType(ITypeScriptType itemType)
    {
        _itemType = itemType;
    }

    public string GetTypeScriptDefinition()
    {
        return _itemType.GetTypeScriptDefinition() + "[]";
    }

    public IEnumerable<IImportableType> GetImports()
    {
        foreach (var import in _itemType.GetImports())
        {
            yield return import;
        }
    }
}