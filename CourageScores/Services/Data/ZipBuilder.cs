using System.IO.Compression;
using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Data;

public class ZipBuilder : IZipBuilder
{
    private readonly IContentEncryptor _encryptor;
    private readonly ZipArchive _zip;
    private readonly MemoryStream _stream;

    public ZipBuilder(IContentEncryptor encryptor)
    {
        _encryptor = encryptor;
        _stream = new MemoryStream();
        _zip = new ZipArchive(_stream, ZipArchiveMode.Create);
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
        await WriteContentEncrypted(entry.Open(), content);
    }

    private async Task WriteContentEncrypted(Stream entry, string content)
    {
        var unencrypted = new MemoryStream();
        using (var streamWriter = new StreamWriter(unencrypted))
        {
            await streamWriter.WriteAsync(content);
        }

        var buffer = new MemoryStream(unencrypted.ToArray());
        await _encryptor.Encrypt(buffer, entry);
    }
}