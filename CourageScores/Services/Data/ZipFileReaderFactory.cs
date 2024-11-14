using System.Diagnostics.CodeAnalysis;
using System.IO.Compression;

namespace CourageScores.Services.Data;

[ExcludeFromCodeCoverage]
public class ZipFileReaderFactory : IZipFileReaderFactory
{
    private readonly IJsonSerializerService _serializer;

    public ZipFileReaderFactory(IJsonSerializerService serializer)
    {
        _serializer = serializer;
    }

    public async Task<IZipFileReader> Create(Stream stream, string? password)
    {
        return await Task.Run(() =>
        {
            var zip = new ZipArchive(stream, ZipArchiveMode.Read);
            /*if (!string.IsNullOrEmpty(password))
            {
                zip.Password = password;
            }*/

            return new ZipFileReader(zip, _serializer);
        });
    }
}