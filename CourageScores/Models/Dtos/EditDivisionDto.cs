using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
public class EditDivisionDto
{
    /// <summary>
    /// The id for the entity
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The name of this division
    /// </summary>
    public string Name { get; set; } = null!;
}