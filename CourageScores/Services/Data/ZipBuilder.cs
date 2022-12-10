using System.IO.Compression;
using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Data;

public class ZipBuilder
{
    private readonly ZipArchive _zip;
    private readonly MemoryStream _stream;

    public ZipBuilder()
    {
        _stream = new MemoryStream();
        _zip = new ZipArchive(_stream, ZipArchiveMode.Create, true);
    }

    public Task<byte[]> CreateZip()
    {
        _zip.Dispose();
        _stream.Seek(0, SeekOrigin.Begin);
        return Task.FromResult(_stream.ToArray());
    }

    public async Task AddFile(string tableName, string id, JObject record, CancellationToken token)
    {
        var fileName = $"{tableName}/{id}.json";
        await AddFile(fileName, record.ToString());
    }

    public async Task AddFile(string fileName, string content)
    {
        var entry = _zip.CreateEntry(fileName);
        using (var writer = new StreamWriter(entry.Open()))
        {
            await writer.WriteAsync(content);
        }
    }
}