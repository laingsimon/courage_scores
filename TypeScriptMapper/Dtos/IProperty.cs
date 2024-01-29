namespace TypeScriptMapper.Dtos;

public interface IProperty
{
    Task WriteTypeTo(TextWriter writer, TypeScriptTypeMapper typeMapper, CancellationToken token);
    IEnumerable<Type> GetImports();
    string Name { get; }
    bool Nullable { get; }
}