using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Data;

public class ZipBuilderFactory : IZipBuilderFactory
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ISystemClock _clock;
    private readonly IUserService _userService;
    private readonly IJsonSerializerService _serializer;

    public ZipBuilderFactory(
        IHttpContextAccessor httpContextAccessor,
        ISystemClock clock,
        IUserService userService,
        IJsonSerializerService serializer)
    {
        _httpContextAccessor = httpContextAccessor;
        _clock = clock;
        _userService = userService;
        _serializer = serializer;
    }

    public async Task<IZipBuilder> Create(string? password, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            throw new InvalidOperationException("Not logged in");
        }

        var apiRequest = _httpContextAccessor.HttpContext?.Request;
        var metaData = new ExportMetaData
        {
            Created = _clock.UtcNow.UtcDateTime,
            Creator = user.Name,
            Hostname = apiRequest!.Host.ToString(),
        };

        var builder = new ZipBuilder(password);
        await builder.AddFile(ExportMetaData.FileName, _serializer.SerialiseToString(metaData));

        return builder;
    }
}