using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos;

/// <summary>
/// The header information for a photo, the id can be used to download the photo
/// </summary>
[ExcludeFromCodeCoverage]
public class PhotoReferenceDto
{
    /// <summary>
    /// The id of the photo
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The date/time the photo was uploaded/replaced
    /// </summary>
    public DateTimeOffset Created { get; set; }

    /// <summary>
    /// The name of the user who created/replaced the photo
    /// </summary>
    public string Author { get; set; } = null!;

    /// <summary>
    /// The size of the file (in bytes)
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// If available, the name of the file
    /// </summary>
    public string? FileName { get; set; }

    /// <summary>
    /// The type of the file
    /// </summary>
    public string ContentType { get; set; } = null!;
}