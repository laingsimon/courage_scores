namespace TypeScriptMapper.MetaData;

public class PromiseTypeScriptType : ITypeScriptType, IImportableType
{
    private readonly ITypeScriptType _taskType;
    private readonly IImportableType? _importableType;

    public PromiseTypeScriptType(ITypeScriptType taskType)
    {
        _taskType = taskType;
        _importableType = taskType as IImportableType;
    }

    public string GetTypeScriptDefinition()
    {
        return $"Promise<{_taskType.GetTypeScriptDefinition()}>";
    }

    public string Name => _importableType?.Name ?? "Promise<any>";
    public string? RelativePath => _importableType?.RelativePath;
}