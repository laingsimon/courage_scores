using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using TypeScriptMapper.Dtos;

namespace TypeScriptMapper.MetaData;

[ExcludeFromCodeCoverage]
public class TypeScriptProperty : ITypeScriptMember
{
    private static readonly Type[] NonNullableTypes = [
        typeof(DateTime),
        typeof(DateTimeOffset),
        typeof(TimeSpan)
    ];

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

    public string Name => _property.Name.ToCamelCase();

    public ObsoleteAttribute? ObsoleteAnnotation => _property.GetCustomAttribute<ObsoleteAttribute>();

    public string GetDefinition()
    {
        return $"{Name}{(IsOptional() ? "?" : "")}: {_helper.GetTypeScriptType(_context, _property.PropertyType).GetTypeScriptDefinition()}";
    }

    private bool IsOptional()
    {
        var reflectedType = _property.ReflectedType;
        var requiredProperties = reflectedType!.GetCustomAttribute<PropertyIsRequired>() ?? new PropertyIsRequired();

        var context = new NullabilityInfoContext();
        var info = context.Create(_property);
        var optional = info.ReadState == NullabilityState.Nullable
            || HasDefaultValue()
            || IsPrimitiveType();

        var required = requiredProperties.PropertyNames.Contains(_property.Name) || NonNullableTypes.Contains(_property.PropertyType);

        return optional && !required;
    }

    private bool IsPrimitiveType()
    {
        return _property.PropertyType.IsValueType
                || Nullable.GetUnderlyingType(_property.PropertyType) != null;
    }

    private bool HasDefaultValue()
    {
        var type = _property.DeclaringType;
        var property = _property;
        try
        {
            if (type!.ContainsGenericParameters)
            {
                type = type.MakeGenericType(typeof(object));
                property = type.GetProperty(_property.Name)!;
            }

            if (type.IsAbstract)
            {
                return false;
            }

            var instance = Activator.CreateInstance(type);
            var propertyValue = property.GetValue(instance);

            if (propertyValue != default)
            {
                return true;
            }
        }
        catch
        {
            // do nothing
        }

        return false;
    }

    public bool IsImplementationOf(ITypeScriptMember member)
    {
        var otherProperty = member as TypeScriptProperty;
        if (otherProperty == null)
        {
            return false;
        }

        return otherProperty._property.Name == _property.Name
               && otherProperty._property.PropertyType == _property.PropertyType;
    }
}