namespace TypeScriptMapper.MetaData;

public interface ITypeScriptMember
{
    /// <summary>
    /// The typescript types references by this type
    /// </summary>
    HashSet<ITypeScriptType> Types { get; }

    /// <summary>
    /// The name of this member, e.g. getUser
    /// </summary>
    string Name { get; }

    /// <summary>
    /// Any parameters for this member
    /// </summary>
    List<TypeScriptParameter> Parameters { get; }

    /// <summary>
    /// Get a typescript representation of this member
    /// </summary>
    /// <returns></returns>
    string GetDefinition();
}