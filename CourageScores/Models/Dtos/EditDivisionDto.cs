using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
public class EditDivisionDto : IIntegrityCheckDto
{
    /// <summary>
    /// The id for the entity
    /// </summary>
    public Guid? Id { get; set; }

    /// <summary>
    /// The name of this division
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Is this division meant to be for superleague tournaments only
    /// </summary>
    public bool Superleague { get; set; }

    public DateTime? LastUpdated { get; set; }
}