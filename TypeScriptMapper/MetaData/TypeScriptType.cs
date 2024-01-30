namespace TypeScriptMapper.MetaData;

public class TypeScriptType : ITypeScriptType, IImportableType
{
    /// <summary>
    /// The dotnet type this typescript type represents
    /// </summary>
    public Type DotNetType { get; set; } = null!;

    /// <summary>
    /// The typescript name for the type, in camel case
    /// </summary>
    public string Name { get; set;} = null!;

    /// <summary>
    /// Whether this type requires any import
    /// </summary>
    public bool IsPrimitive { get; set; }

    /// <summary>
    /// Where this imported type would be found, relative to the root import directory
    /// </summary>
    public string? RelativePath { get; set; }

    public string GetTypeScriptDefinition()
    {
        return Name;
    }

    public IEnumerable<IImportableType> GetImports()
    {
        yield return this;
    }
}