using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
public abstract class CosmosDto
{
    /// <summary>
    /// The id for the entity
    /// </summary>
    public Guid Id { get; set; }
}