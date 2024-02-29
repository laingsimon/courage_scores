namespace CourageScores.Services;

public interface IPhotoSettings
{
    /// <summary>
    /// The minimum file size for any photo
    /// </summary>
    long MinPhotoFileSize { get; }

    /// <summary>
    /// The maximum number of photos allowed per entity
    /// </summary>
    int MaxPhotoCountPerEntity { get; }

    /// <summary>
    /// The maximum height of each photo (photos will be resized if larger)
    /// </summary>
    int MaxPhotoHeight { get; }
}