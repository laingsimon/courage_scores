namespace TypeScriptMapper;

public class DictionaryProperty : IProperty
{
    public string Name { get; init; } = null!;
    public IProperty Key { get; init; } = null!;
    public IProperty Value { get; init; } = null!;
    public bool Nullable { get; init; }

    public async Task WriteTypeTo(TextWriter writer, TypeScriptTypeMapper typeMapper, CancellationToken token)
    {
        await writer.WriteAsync("{");
        await writer.WriteAsync(" [key: ");
        await Key.WriteTypeTo(writer, typeMapper, token);
        await writer.WriteAsync("]: ");
        await Value.WriteTypeTo(writer, typeMapper, token);
        await writer.WriteAsync(" }");
    }

    public IEnumerable<Type> GetImports()
    {
        return new[]
        {
            Key,
            Value,
        }.SelectMany(p => p.GetImports());
    }
}