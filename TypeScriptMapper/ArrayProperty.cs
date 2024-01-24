namespace TypeScriptMapper;

public class ArrayProperty : IProperty
{
    public string Name { get; init; } = null!;
    public IProperty ItemType { get; init; } = null!;
    public bool Nullable { get; init; }

    public async Task WriteTypeTo(TextWriter writer, TypeScriptTypeMapper typeMapper, CancellationToken token)
    {
        await ItemType.WriteTypeTo(writer, typeMapper, token);
        await writer.WriteAsync("[]");
    }

    public IEnumerable<Type> GetImports()
    {
        return ItemType.GetImports();
    }
}