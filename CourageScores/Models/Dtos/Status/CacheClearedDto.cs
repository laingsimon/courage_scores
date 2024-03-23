using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Status;

[ExcludeFromCodeCoverage]
public class CacheClearedDto
{
    public List<Dictionary<string, object?>> Keys { get; set; } = new();
}