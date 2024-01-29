using System.Diagnostics.CodeAnalysis;
using TypeScriptMapper;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
[PropertyIsOptional(nameof(Id))]
public class EditDivisionDto : IIntegrityCheckDto
{
    /// <summary>
    /// The id for the entity
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The name of this division
    /// </summary>
    public string Name { get; set; } = null!;

    public DateTime? LastUpdated { get; set; }
}