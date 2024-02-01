using System.Diagnostics.CodeAnalysis;
using TypeScriptMapper.Dtos;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
[PropertyIsRequired(nameof(Id))]
public abstract class CosmosDto
{
    /// <summary>
    /// The id for the entity
    /// </summary>
    public Guid Id { get; set; }
}