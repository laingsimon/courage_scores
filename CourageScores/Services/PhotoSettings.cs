namespace CourageScores.Services;

public class PhotoSettings : IPhotoSettings
{
    public long MinPhotoFileSize { get; }
    public int MaxPhotoCountPerEntity { get; }
    public int MaxPhotoHeight { get; }

    public PhotoSettings(IConfiguration configuration)
    {
        MinPhotoFileSize = GetLong(configuration, "MinPhotoFileSize", 1024);
        MaxPhotoCountPerEntity = (int)GetLong(configuration, "MaxPhotoCountPerEntity", 2);
        MaxPhotoHeight = (int)GetLong(configuration, "MaxPhotoHeight", 5000);
    }

    private static long GetLong(IConfiguration configuration, string key, long defaultValue)
    {
        var value = configuration.GetSection("PhotoSettings")[key];
        return long.TryParse(value, out var longValue)
            ? longValue
            : defaultValue;
    }
}