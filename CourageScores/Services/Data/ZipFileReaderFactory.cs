namespace CourageScores.Services.Data;

public class ZipFileReaderFactory : IZipFileReaderFactory
{
    public async Task<IZipFileReader> Create(Stream stream, string? password)
    {
        return await ZipFileReader.OpenZipFile(stream, password);
    }
}