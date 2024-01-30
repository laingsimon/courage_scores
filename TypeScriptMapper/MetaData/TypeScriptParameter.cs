using System.Reflection;
using Microsoft.AspNetCore.Mvc;

namespace TypeScriptMapper.MetaData;

public class TypeScriptParameter
{
    private readonly ParameterInfo _parameterInfo;
    private readonly IMetaDataHelper _helper;
    private readonly HelperContext _context;

    public TypeScriptParameter(ParameterInfo parameterInfo, IMetaDataHelper helper, HelperContext context)
    {
        _parameterInfo = parameterInfo;
        _helper = helper;
        _context = context;
    }

    public ITypeScriptType Type => _helper.GetTypeScriptType(_context, _parameterInfo.ParameterType);

    public bool IsBodyParameter => _parameterInfo.GetCustomAttribute<FromBodyAttribute>() != null;
    public bool IsCancellationToken => _parameterInfo.ParameterType == typeof(CancellationToken);
    public string Name => _parameterInfo.Name!;
    public Type ParameterType => _parameterInfo.ParameterType;

    public string GetDefinition()
    {
        return $"{Name}: {Type.GetTypeScriptDefinition()}";
    }
}