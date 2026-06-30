using System.IO.Compression;
using AutoFixture;
using CourageScores.Models.Dtos.Data;
using CourageScores.Services;
using CourageScores.Services.Data;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Data;

[TestFixture]
public class ZipBuilderFactoryTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private readonly DateTimeOffset _utcNow = DateTimeOffset.UtcNow;
    private readonly IJsonSerializerService _serializer = new JsonSerializerService(new JsonSerializer());
    private HttpContext _httpContext = null!;
    private ZipBuilderFactory _factory = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        fixture.Register(() => _serializer);
        var httpContextAccessor = fixture.FreezeMock<IHttpContextAccessor>();
        var clock = fixture.FreezeMock<TimeProvider>();
        _httpContext = new DefaultHttpContext();
        _factory = fixture.Create<ZipBuilderFactory>();

        httpContextAccessor.Setup(a => a.HttpContext).Returns(_httpContext);
        clock.Setup(c => c.GetUtcNow()).Returns(_utcNow);
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
                    "TABLE 1", [Guid.Empty]
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
        await using var zip = new ZipArchive(new MemoryStream(zipBytes), ZipArchiveMode.Read);
        var encryptor = string.IsNullOrEmpty(password) ? NullContentEncryptor.Instance : new ContentEncryptor(password);

        var entries = zip.Entries.ToList();
        Assert.That(entries, Is.Not.Empty);
        Assert.That(entries.Select(e => e.FullName), Has.Member("meta.json"));
        var entry = zip.GetEntry("meta.json");
        using var content = new MemoryStream();
        await (await entry!.OpenAsync()).CopyToAsync(content);
        content.Seek(0, SeekOrigin.Begin);

        using var decrypted = new MemoryStream();
        await encryptor.Decrypt(content, decrypted);
        decrypted.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(decrypted);
        var json = await reader.ReadToEndAsync();
        return JsonConvert.DeserializeObject<ExportMetaData>(json)!;
    }
}
