using CourageScores.Models.Dtos.Data;

namespace CourageScores.Services.Data;

public class ZipBuilderFactory : IZipBuilderFactory
{
    private readonly TimeProvider _clock;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IJsonSerializerService _serializer;

    public ZipBuilderFactory(
        IHttpContextAccessor httpContextAccessor,
        TimeProvider clock,
        IJsonSerializerService serializer)
    {
        _httpContextAccessor = httpContextAccessor;
        _clock = clock;
        _serializer = serializer;
    }

    public async Task<IZipBuilder> Create(string userName, ExportDataRequestDto exportRequest, CancellationToken token)
    {
        if (string.IsNullOrEmpty(userName))
        {
            throw new InvalidOperationException("Username cannot be empty");
        }

        var apiRequest = _httpContextAccessor.HttpContext?.Request;
        var metaData = new ExportMetaData
        {
            Created = _clock.GetUtcNow().UtcDateTime,
            Creator = userName,
            Hostname = apiRequest!.Host.ToString(),
#pragma warning disable CS0618
            RequestedTables = exportRequest.Tables,
#pragma warning restore CS0618
        };

        var encryptor = string.IsNullOrEmpty(exportRequest.Password)
            ? NullContentEncryptor.Instance
            : new ContentEncryptor(exportRequest.Password);
        var builder = new ZipBuilder(encryptor);
        await builder.AddFile(ExportMetaData.FileName, _serializer.SerialiseToString(metaData));

        return builder;
    }
}