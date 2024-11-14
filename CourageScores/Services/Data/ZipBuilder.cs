using System.IO.Compression;
using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Data;

public class ZipBuilder : IZipBuilder
{
    private readonly ZipArchive _zip;
    private readonly MemoryStream _stream;

    public ZipBuilder(string? password)
    {
        _stream = new MemoryStream();
        _zip = new ZipArchive(_stream, ZipArchiveMode.Create);
        /*if (!string.IsNullOrEmpty(password))
        {
            _zip.Password = password;
        }*/
    }

    public Task<byte[]> CreateZip()
    {
        _zip.Dispose();
        return Task.FromResult(_stream.ToArray());
    }

    public async Task AddFile(string tableName, string id, JObject record)
    {
        var fileName = $"{tableName}/{id}.json";
        await AddFile(fileName, record.ToString());
    }

    public async Task AddFile(string fileName, string content)
    {
        var entry = _zip.CreateEntry(fileName);
        using (var streamWriter = new StreamWriter(entry.Open()))
        {
            await streamWriter.WriteAsync(content);
        }
    }
}