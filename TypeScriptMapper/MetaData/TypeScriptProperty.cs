using System.Reflection;

namespace TypeScriptMapper.MetaData;

public class TypeScriptProperty : ITypeScriptMember
{
    private readonly PropertyInfo _property;
    private readonly IMetaDataHelper _helper;
    private readonly HelperContext _context;

    public TypeScriptProperty(PropertyInfo property, IMetaDataHelper helper, HelperContext context)
    {
        _property = property;
        _helper = helper;
        _context = context;
    }

    public IEnumerable<ITypeScriptType> Types => new [] { _helper.GetTypeScriptType(_context, _property.PropertyType) }.ToHashSet();

    public bool IsExcluded => _property.GetCustomAttribute<ExcludeFromTypeScriptAttribute>() != null;

    public string Name => _property.Name.ToCamelCase();

    public List<TypeScriptParameter> Parameters => new();

    public string GetDefinition()
    {
        return $"{Name}{(IsOptional() ? "?" : "")}: {_helper.GetTypeScriptType(_context, _property.PropertyType).GetTypeScriptDefinition()}";
    }

    private bool IsOptional()
    {
        var context = new NullabilityInfoContext();
        var info = context.Create(_property);
        return info.ReadState == NullabilityState.Nullable;
    }
}