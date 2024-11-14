namespace CourageScores.Services.Data;

public class NullContentEncryptor : IContentEncryptor
{
    public static readonly IContentEncryptor Instance = new NullContentEncryptor();

    private NullContentEncryptor()
    { }

    public async Task Encrypt(Stream source, Stream destination)
    {
        await source.CopyToAsync(destination);
    }

    public async Task Decrypt(Stream source, Stream destination)
    {
        await source.CopyToAsync(destination);
    }
}