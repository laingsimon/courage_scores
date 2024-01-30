namespace TypeScriptMapper.MetaData;

public interface ITypeScriptMember
{
    /// <summary>
    /// The typescript types references by this type
    /// </summary>
    IEnumerable<ITypeScriptType> Types { get; }

    /// <summary>
    /// The name of this member, e.g. getUser
    /// </summary>
    string Name { get; }

    /// <summary>
    /// Should this member be excluded from the typescript API?
    /// </summary>
    bool IsExcluded { get; }

    /// <summary>
    /// Get a typescript representation of this member
    /// </summary>
    /// <returns></returns>
    string GetDefinition();
}