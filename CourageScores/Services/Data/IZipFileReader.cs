namespace CourageScores.Services.Data;

public interface IZipFileReader
{
    bool HasFile(string fileName);
    Task<T> ReadJson<T>(string fileName);
    IEnumerable<string> EnumerateFiles(string path);
}