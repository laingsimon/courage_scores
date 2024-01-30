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

    public IEnumerable<IImportableType> GetImports()
    {
        return OuterType.GetImports().Concat(GenericTypes.SelectMany(gt => gt.GetImports()));
    }

    public ITypeScriptType ToNullable()
    {
        return new NullableTypeScriptType(this);
    }
}