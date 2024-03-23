namespace TypeScriptMapper.MetaData;

public interface IMetaDataHelper
{
    ITypeScriptType GetTypeScriptType(HelperContext context, Type type);
    string GetRelativePath(HelperContext context, string ns);
}