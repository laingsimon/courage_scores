namespace TypeScriptMapper;

public class TypescriptType : IType
{
    public Type DotNetType { get; init; } = null!;
    public IReadOnlyCollection<IProperty> Properties { get; init; } = null!;
}