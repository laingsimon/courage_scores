namespace TypeScriptMapper.Dtos;

public interface IType
{
    Type DotNetType { get; }
    IReadOnlyCollection<IProperty> Properties { get; }
}