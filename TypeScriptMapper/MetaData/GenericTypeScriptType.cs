namespace TypeScriptMapper.MetaData;

public class GenericTypeScriptType : ITypeScriptType
{
    public ITypeScriptType OuterType { get; init; } = null!;
    public List<ITypeScriptType> GenericTypes { get; init; } = null!;

    public HashSet<ITypeScriptType> Types => new[] { OuterType }.Concat(GenericTypes).ToHashSet();

    public string GetTypeScriptDefinition()
    {
        return $"{OuterType.GetTypeScriptDefinition()}<{string.Join(", ", GenericTypes.Select(gt => gt.GetTypeScriptDefinition()))}>";
    }
}