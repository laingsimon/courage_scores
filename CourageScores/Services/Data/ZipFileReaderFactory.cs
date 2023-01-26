using Ionic.Zip;

namespace CourageScores.Services.Data;

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
            var zip = ZipFile.Read(stream);
            if (!string.IsNullOrEmpty(password))
            {
                zip.Password = password;
            }

            return new ZipFileReader(zip, _serializer);
        });
    }
}