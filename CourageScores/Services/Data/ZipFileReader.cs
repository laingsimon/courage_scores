using Ionic.Zip;
using Newtonsoft.Json;

namespace CourageScores.Services.Data;

public class ZipFileReader : IZipFileReader
{
    private static readonly JsonSerializer Serializer = new JsonSerializer();
    private readonly ZipFile _zip;

    private ZipFileReader(ZipFile zip)
    {
        _zip = zip;
    }

    public static async Task<IZipFileReader> OpenZipFile(Stream input, string? password)
    {
        return await Task.Run(() =>
        {
            var zip = ZipFile.Read(input);
            if (!string.IsNullOrEmpty(password))
            {
                zip.Password = password;
            }

            return new ZipFileReader(zip);
        });
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

            using (var reader = new JsonTextReader(new StreamReader(stream)))
            {
                return Serializer.Deserialize<T>(reader);
            }
        });
    }

    public IEnumerable<string> EnumerateFiles(string path)
    {
        return _zip.Entries.Where(e => e.FileName.StartsWith(path)).Select(e => e.FileName);
    }
}