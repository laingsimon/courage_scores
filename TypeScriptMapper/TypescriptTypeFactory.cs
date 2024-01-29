using System.Collections;
using System.Reflection;
using Newtonsoft.Json;

namespace TypeScriptMapper;

public class TypescriptTypeFactory
{
    public IType Create(Type type)
    {
        return new TypescriptType
        {
            DotNetType = type,
            Properties = GetProperties(type).ToArray(),
        };
    }

    private static IEnumerable<IProperty> GetProperties(Type type)
    {
        object? instance = null;
        try
        {
            var createdObjectType = type;
            if (createdObjectType.ContainsGenericParameters)
            {
                createdObjectType = createdObjectType.MakeGenericType(createdObjectType.GetGenericArguments().Select(_ => typeof(object)).ToArray());
            }

            instance = Activator.CreateInstance(createdObjectType);
        }
        catch
        {
            // do nothing
        }

        var relevantProperties = type.GetProperties().Where(p => p.GetCustomAttribute<JsonIgnoreAttribute>() == null);
        foreach (var property in relevantProperties)
        {
            yield return GetProperty(property.Name, property.PropertyType, property, instance, type);
        }
    }

    private static IProperty GetProperty(string name, Type propertyType, PropertyInfo? property, object? instance, Type? dtoType)
    {
        var underlyingNullableType = Nullable.GetUnderlyingType(propertyType);
        if (propertyType.IsEnum || underlyingNullableType?.IsEnum == true)
        {
            return new TypedProperty
            {
                Name = ToCamelCase(name),
                Nullable = underlyingNullableType != null,
                PropertyType = typeof(string),
            };
        }

        if (propertyType.IsAssignableTo(typeof(IDictionary)) && propertyType.GetGenericArguments().Length == 2)
        {
            return new DictionaryProperty
            {
                Name = ToCamelCase(name),
                Key = GetProperty("key", propertyType.GetGenericArguments()[0], null, null, propertyType),
                Value = GetProperty("value", propertyType.GetGenericArguments()[1], null, null, propertyType),
                Nullable = IsNullableReferenceType(property, instance, dtoType),
            };
        }

        if (propertyType.IsAssignableTo(typeof(IEnumerable)) && propertyType != typeof(string))
        {
            var itemType = propertyType.GetGenericArguments().ElementAtOrDefault(0) ?? propertyType.GetElementType();
            if (itemType != typeof(byte))
            {
                var itemProperty = GetProperty(name, itemType!, null, null, itemType);
                return new ArrayProperty
                {
                    Name = ToCamelCase(name),
                    ItemType = itemProperty,
                    Nullable = IsNullableReferenceType(property, instance, dtoType),
                };
            }
        }

        // custom type
        return new TypedProperty
        {
            Name = ToCamelCase(name),
            PropertyType = underlyingNullableType ?? propertyType,
            Nullable = underlyingNullableType != null || IsNullableReferenceType(property, instance, dtoType),
        };
    }

    private static string ToCamelCase(string name)
    {
        return name.Substring(0, 1).ToLower() + name.Substring(1);
    }

    private static bool IsNullableReferenceType(PropertyInfo? property, object? instance, Type? dtoType)
    {
        if (property == null)
        {
            return false;
        }

        if (property.PropertyType.IsValueType)
        {
            return IsOptionalValueTypeProperty(property, dtoType);
        }

        var context = new NullabilityInfoContext();
        var nullabilityInfo = context.Create(property);
        object? defaultedPropertyValue = null;
        try
        {
            defaultedPropertyValue = instance != null ? property.GetValue(instance) : null;
        }
        catch (InvalidOperationException)
        {
            if (instance != null)
            {
                defaultedPropertyValue = instance.GetType().GetProperty(property.Name)?.GetValue(instance);
            }
        }

        switch (nullabilityInfo.ReadState)
        {
            case NullabilityState.Nullable:
                return true;
            case NullabilityState.NotNull:
                return defaultedPropertyValue != null;
            default:
                return defaultedPropertyValue == null;
        }
    }

    private static bool IsOptionalValueTypeProperty(PropertyInfo property, Type? dtoType)
    {
        var optionalProperty = dtoType?.GetCustomAttribute<PropertyIsOptional>();
        if (optionalProperty?.PropertyNames.Contains(property.Name) == true)
        {
            return true;
        }

        switch (property.Name)
        {
            case "Id":
                return false;
            default:
                return true;
        }
    }
}