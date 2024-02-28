using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos;

[ExcludeFromCodeCoverage]
public class PhotoReference
{
    public Guid Id { get; set; }
    public DateTimeOffset Created { get; set; }
    public string Author { get; set; } = null!;
    public long FileSize { get; set; }
    public string? FileName { get; set; }
    public string ContentType { get; set; } = null!;
}