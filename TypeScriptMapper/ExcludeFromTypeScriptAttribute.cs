namespace TypeScriptMapper;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class | AttributeTargets.Property | AttributeTargets.Interface)]
public class ExcludeFromTypeScriptAttribute : Attribute
{
}
