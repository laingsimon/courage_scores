namespace TypeScriptMapper;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class | AttributeTargets.Property)]
public class ExcludeFromTypeScriptAttribute : Attribute
{
}