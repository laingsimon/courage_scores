using CourageScores.Services.Data;
using Ionic.Zip;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Data;

[TestFixture]
public class ZipBuilderTests
{
    [Test]
    public async Task AddFile_WhenCalled_FormatsFileCorrectly()
    {
        var zip = new ZipBuilder(null);

        await zip.AddFile("table", "id", JObject.FromObject(new CourageScores.Models.Cosmos.Division()));

        var files = ZipFile.Read(new MemoryStream(await zip.CreateZip())).Entries.Select(e => e.FileName);
        Assert.That(files, Is.EqualTo(new[]
        {
            "table/id.json",
        }));
    }

    [Test]
    public async Task CreateZip_WhenPasswordSupplied_CreatesEncryptedZip()
    {
        var writing = new ZipBuilder("password");
        await writing.AddFile("content.txt", "content");

        var bytes = await writing.CreateZip();

        var reading = ZipFile.Read(new MemoryStream(bytes));
        var firstEntry = reading.Entries.First();
        Assert.That(firstEntry.FileName, Is.EqualTo("content.txt"));
        Assert.That(() => firstEntry.Extract(new MemoryStream()), Throws.TypeOf<BadPasswordException>());
        reading.Password = "password";
        Assert.That(() => firstEntry.Extract(new MemoryStream()), Throws.Nothing);
    }

    [Test]
    public async Task CreateZip_WhenNoPasswordSupplied_CreatesUnencryptedZip()
    {
        var writing = new ZipBuilder(null);
        await writing.AddFile("content.txt", "content");

        var bytes = await writing.CreateZip();

        var reading = ZipFile.Read(new MemoryStream(bytes));
        var firstEntry = reading.Entries.First();
        Assert.That(firstEntry.FileName, Is.EqualTo("content.txt"));
        Assert.That(() => firstEntry.Extract(new MemoryStream()), Throws.Nothing);
        reading.Password = "password";
        Assert.That(() => firstEntry.Extract(new MemoryStream()), Throws.Nothing);
    }
}