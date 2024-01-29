namespace TypeScriptMapper.MetaData;

public class TypeScriptGenericArgument
{
    private readonly Type _genericArgument;
    private readonly IMetaDataHelper _helper;
    private readonly HelperContext _context;

    public TypeScriptGenericArgument(Type genericArgument, IMetaDataHelper helper, HelperContext context)
    {
        _genericArgument = genericArgument;
        _helper = helper;
        _context = context;
    }

    public ITypeScriptType Type => _helper.GetTypeScriptType(_context, _genericArgument);
}