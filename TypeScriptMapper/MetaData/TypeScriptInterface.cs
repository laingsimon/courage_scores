using System.Diagnostics.CodeAnalysis;

namespace TypeScriptMapper.MetaData;

/// <summary>
/// The meta data for a dotnet type in typescript terms
/// </summary>
[ExcludeFromCodeCoverage]
public class TypeScriptInterface
{
    /// <summary>
    /// The dotnet type this typescript type represents
    /// </summary>
    public Type DotNetType { get; init; } = null!;

    /// <summary>
    /// The name of this typescript type, e.g. IUserDto
    /// </summary>
    public string Name { get; init; } = null!;

    /// <summary>
    /// The members defined on this typescript type
    /// </summary>
    public List<ITypeScriptMember> Members { get; init; } = null!;

    /// <summary>
    /// Any generic arguments used in this typescript type
    /// </summary>
    public List<TypeScriptGenericArgument> GenericArguments { get; init; } = null!;

    /// <summary>
    /// The path relative to the root directory of the generated output
    /// </summary>
    public string RelativePath { get; set; } = null!;

    /// <summary>
    /// The typescript types required in any part of this interface
    /// </summary>
    public IEnumerable<ITypeScriptType> Types => Members
        .SelectMany(m => m.Types)
        .Concat(GenericArguments.Select(ga => ga.Type));
}