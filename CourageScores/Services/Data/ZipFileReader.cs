using Ionic.Zip;

namespace CourageScores.Services.Data;

public class ZipFileReader : IZipFileReader
{
    private readonly IJsonSerializerService _serializer;
    private readonly ZipFile _zip;

    public ZipFileReader(ZipFile zip, IJsonSerializerService serializer)
    {
        _zip = zip;
        _serializer = serializer;
    }

    public bool HasFile(string fileName)
    {
        return _zip.ContainsEntry(fileName);
    }

    public async Task<T> ReadJson<T>(string fileName)
    {
        return await Task.Run(() =>
        {
            var stream = new MemoryStream();
            var entry = _zip.Entries.SingleOrDefault(e => e.FileName == fileName);
            if (entry == null)
            {
                throw new FileNotFoundException("File not found", fileName);
            }

            entry.Extract(stream);
            stream.Seek(0, SeekOrigin.Begin);

            return _serializer.DeserialiseTo<T>(stream);
        });
    }

    public IEnumerable<string> EnumerateFiles(string path)
    {
        return _zip.Entries.Where(e => e.FileName.StartsWith(path)).Select(e => e.FileName);
    }
}