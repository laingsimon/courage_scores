using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
public abstract class AuditedDto : CosmosDto
{
    /// <summary>
    /// When was this entity created
    /// </summary>
    public DateTime? Created { get; set; }

    /// <summary>
    /// Who created this entity
    /// </summary>
    public string? Author { get; set; }

    /// <summary>
    /// When was this entity last edited
    /// </summary>
    public DateTime? Updated { get; set; }

    /// <summary>
    /// Who last modified this entity
    /// </summary>
    public string? Editor { get; set; }

    /// <summary>
    /// When was this entity deleted
    /// </summary>
    public DateTime? Deleted { get; set; }

    /// <summary>
    /// Who deleted this entity
    /// </summary>
    public string? Remover { get; set; }
}