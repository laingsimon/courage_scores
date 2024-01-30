namespace TypeScriptMapper.Dtos;

[AttributeUsage(AttributeTargets.Class)]
public class PropertyIsRequired : Attribute
{
    public string[] PropertyNames { get; }

    public PropertyIsRequired(params string[] propertyNames)
    {
        PropertyNames = propertyNames;
    }
}