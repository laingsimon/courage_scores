namespace TypeScriptMapper;

[AttributeUsage(AttributeTargets.Class)]
public class PropertyIsOptional : Attribute
{
    public string[] PropertyNames { get; }

    public PropertyIsOptional(params string[] propertyNames)
    {
        PropertyNames = propertyNames;
    }
}