namespace TypeScriptMapper.MetaData;

public interface ITypeScriptType
{
    string GetTypeScriptDefinition();
    IEnumerable<IImportableType> GetImports();
    ITypeScriptType ToNullable();
}