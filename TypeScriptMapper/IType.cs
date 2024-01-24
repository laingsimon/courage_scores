namespace TypeScriptMapper;

public interface IType
{
    Type DotNetType { get; }
    IReadOnlyCollection<IProperty> Properties { get; }
}