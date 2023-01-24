namespace CourageScores.Services.Data;

public interface IZipFileReaderFactory
{
    Task<IZipFileReader> Create(Stream stream, string? password);
}