namespace TypeScriptMapper.MetaData;

public interface IImportableType
{
    /// <summary>
    /// The typescript name for the type, in camel case
    /// </summary>
    string Name { get; }
    /// <summary>
    /// Where this imported type would be found, relative to the root import directory
    /// </summary>
    string? RelativePath { get; }
}