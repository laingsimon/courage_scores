using Ionic.Zip;
using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Data;

public class ZipBuilder : IZipBuilder
{
    private readonly ZipFile _zip;

    public ZipBuilder(string? password)
    {
        _zip = new ZipFile();
        if (!string.IsNullOrEmpty(password))
        {
            _zip.Password = password;
        }
    }

    public Task<byte[]> CreateZip()
    {
        var stream = new MemoryStream();
        _zip.Save(stream);
        return Task.FromResult(stream.ToArray());
    }

    public async Task AddFile(string tableName, string id, JObject record)
    {
        var fileName = $"{tableName}/{id}.json";
        await AddFile(fileName, record.ToString()!);
    }

    public Task AddFile(string fileName, string content)
    {
        return Task.Run(() => { _zip.AddEntry(fileName, content); });
    }
}