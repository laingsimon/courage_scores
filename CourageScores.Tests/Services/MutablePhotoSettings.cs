using CourageScores.Services;

namespace CourageScores.Tests.Services;

public class MutablePhotoSettings : IPhotoSettings
{
    public long MinPhotoFileSize { get; set; }
    public int MaxPhotoCountPerEntity { get; set; }
    public int MaxPhotoHeight { get; set; }
}