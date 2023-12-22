using CourageScores.Models.Dtos.Data;
using CourageScores.Services;
using CourageScores.Services.Data;
using Ionic.Zip;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Moq;
using Newtonsoft.Json;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Data;

[TestFixture]
public class ZipBuilderFactoryTests
{
    private readonly CancellationToken _token = new();
    private readonly DateTimeOffset _utcNow = DateTimeOffset.UtcNow;
    private readonly IJsonSerializerService _serializer = new JsonSerializerService(new JsonSerializer());
    private Mock<ISystemClock> _clock = null!;
    private Mock<IHttpContextAccessor> _httpContextAccessor = null!;
    private HttpContext _httpContext = null!;
    private ZipBuilderFactory _factory = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _httpContextAccessor = new Mock<IHttpContextAccessor>();
        _clock = new Mock<ISystemClock>();
        _httpContext = new DefaultHttpContext();
        _factory = new ZipBuilderFactory(_httpContextAccessor.Object, _clock.Object, _serializer);

        _httpContextAccessor.Setup(a => a.HttpContext).Returns(_httpContext);
        _clock.Setup(c => c.UtcNow).Returns(_utcNow);
    }

    [Test]
    public async Task Create_GivenPassword_CreatesZipFileWithPassword()
    {
        var zipBuilder = await _factory.Create("USER", new ExportDataRequestDto
        {
            Password = "a password",
        }, _token);

        var metaData = await AssertZipCanBeRead(zipBuilder, "a password");
        Assert.That(metaData.Creator, Is.EqualTo("USER"));
    }

    [TestCase("")]
    [TestCase(null)]
    public async Task Create_GivenNoPassword_CreatesZipFileWithPassword(string password)
    {
        var zipBuilder = await _factory.Create("USER", new ExportDataRequestDto
        {
            Password = password,
        }, _token);

        var metaData = await AssertZipCanBeRead(zipBuilder, password);
        Assert.That(metaData.Creator, Is.EqualTo("USER"));
    }

    [Test]
    public async Task Create_WhenLoggedIn_SerialisesMetaDataWithUserName()
    {
        var zipBuilder = await _factory.Create("USER", new ExportDataRequestDto
        {
            Password = "a password",
        }, _token);

        var metaData = await AssertZipCanBeRead(zipBuilder, "a password");
        Assert.That(metaData.Creator, Is.EqualTo("USER"));
    }

    [Test]
    public void Create_WhenNoUserName_Throws()
    {
        Assert.ThrowsAsync<InvalidOperationException>(
            () => _factory.Create("", new ExportDataRequestDto(), _token));
        Assert.ThrowsAsync<InvalidOperationException>(
#pragma warning disable CS8625
            () => _factory.Create(null, new ExportDataRequestDto(), _token));
#pragma warning restore CS8625
    }

    [Test]
    public async Task Create_WhenLoggedIn_SerialisesMetaDataWithHostName()
    {
        _httpContext.Request.Host = new HostString("hostname");

        var zipBuilder = await _factory.Create("USER", new ExportDataRequestDto
        {
            Password = "a password",
        }, _token);

        var metaData = await AssertZipCanBeRead(zipBuilder, "a password");
        Assert.That(metaData.Hostname, Is.EqualTo("hostname"));
    }

    [Test]
    public async Task Create_WhenLoggedIn_SerialisesMetaDataWithDateTime()
    {
        var zipBuilder = await _factory.Create("USER", new ExportDataRequestDto
        {
            Password = "a password",
        }, _token);

        var metaData = await AssertZipCanBeRead(zipBuilder, "a password");
        Assert.That(metaData.Created, Is.EqualTo(_utcNow.UtcDateTime));
    }

    [Test]
    public async Task Create_WhenLoggedIn_SerialisesMetaDataWithRequestedTables()
    {
        var request = new ExportDataRequestDto
        {
            Password = "a password",
#pragma warning disable CS0618
            Tables =
            {
                {
                    "TABLE 1", new List<Guid>(new[]
                    {
                        Guid.Empty,
                    })
                },
            },
#pragma warning restore CS0618
        };
        var zipBuilder = await _factory.Create("USER", request, _token);

        var metaData = await AssertZipCanBeRead(zipBuilder, "a password");
#pragma warning disable CS0618
        Assert.That(metaData.RequestedTables.Keys, Is.EqualTo(request.Tables.Keys));
        Assert.That(metaData.RequestedTables["TABLE 1"], Is.EqualTo(request.Tables["TABLE 1"]));
#pragma warning restore CS0618
    }

    private static async Task<ExportMetaData> AssertZipCanBeRead(IZipBuilder builder, string password)
    {
        var zipBytes = await builder.CreateZip();
        var zip = ZipFile.Read(new MemoryStream(zipBytes));
        zip.Password = password;

        var entries = zip.Entries.ToList();
        Assert.That(entries, Is.Not.Empty);
        Assert.That(entries.Select(e => e.FileName), Has.Member("meta.json"));
        var entry = zip.Entries.Single(e => e.FileName == "meta.json");
        var content = new MemoryStream();
        entry.Extract(content);
        content.Seek(0, SeekOrigin.Begin);

        var json = await new StreamReader(content).ReadToEndAsync();
        return JsonConvert.DeserializeObject<ExportMetaData>(json)!;
    }
}