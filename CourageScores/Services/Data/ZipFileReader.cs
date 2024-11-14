using System.IO.Compression;

namespace CourageScores.Services.Data;

public class ZipFileReader : IZipFileReader
{
    private readonly IJsonSerializerService _serializer;
    private readonly ZipArchive _zip;

    public ZipFileReader(ZipArchive zip, IJsonSerializerService serializer)
    {
        _zip = zip;
        _serializer = serializer;
    }

    public bool HasFile(string fileName)
    {
        return _zip.Entries.Any(e => e.FullName.EndsWith(fileName, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<T> ReadJson<T>(string fileName)
    {
        var stream = new MemoryStream();
        var entry = _zip.GetEntry(fileName);
        if (entry == null)
        {
            throw new FileNotFoundException("File not found", fileName);
        }

        await entry.Open().CopyToAsync(stream);
        stream.Seek(0, SeekOrigin.Begin);

        return _serializer.DeserialiseTo<T>(stream);
    }

    public IEnumerable<string> EnumerateFiles(string path)
    {
        return _zip.Entries.Where(e => e.FullName.StartsWith(path)).Select(e => e.FullName);
    }
}