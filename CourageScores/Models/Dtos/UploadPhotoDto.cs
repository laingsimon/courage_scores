using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
public class UploadPhotoDto
{
    /// <summary>
    /// The id of the entity to attach the photo to
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The photo to upload
    /// </summary>
    public IFormFile? Photo { get; set; }
}