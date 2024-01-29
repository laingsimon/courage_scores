namespace TypeScriptMapper.Dtos;

public class TypedProperty : IProperty
{
    public string Name { get; init; } = null!;
    public Type PropertyType { get; init; } = null!;
    public bool Nullable { get; init; }

    public async Task WriteTypeTo(TextWriter writer, TypeScriptTypeMapper typeMapper, CancellationToken token)
    {
        await writer.WriteAsync(typeMapper.GetTypeScriptType(PropertyType));
    }

    public IEnumerable<Type> GetImports()
    {
        return new[]
        {
            PropertyType,
        };
    }
}