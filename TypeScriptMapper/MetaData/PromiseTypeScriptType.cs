namespace TypeScriptMapper.MetaData;

public class PromiseTypeScriptType : ITypeScriptType
{
    private readonly ITypeScriptType _taskType;

    public PromiseTypeScriptType(ITypeScriptType taskType)
    {
        _taskType = taskType;
    }

    public string GetTypeScriptDefinition()
    {
        return $"Promise<{_taskType.GetTypeScriptDefinition()}>";
    }

    public IEnumerable<IImportableType> GetImports()
    {
        foreach (var import in _taskType.GetImports())
        {
            yield return import;
        }
    }
}