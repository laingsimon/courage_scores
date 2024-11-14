using System.IO.Compression;
using CourageScores.Services.Data;
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

        using (var archive = new ZipArchive(new MemoryStream(await zip.CreateZip())))
        {
            var files = archive.Entries.Select(e => e.FullName);
            Assert.That(files, Is.EqualTo(new[]
            {
                "table/id.json",
            }));
        }
    }

    [Test, Ignore("Password protected archives are not supported currently")]
    public async Task CreateZip_WhenPasswordSupplied_CreatesEncryptedZip()
    {
        var writing = new ZipBuilder("password");
        await writing.AddFile("content.txt", "content");

        var bytes = await writing.CreateZip();

        var reading = new ZipArchive(new MemoryStream(bytes), ZipArchiveMode.Read);
        var firstEntry = reading.Entries.First();
        Assert.That(firstEntry.FullName, Is.EqualTo("content.txt"));
        // Assert.That(() => firstEntry.Open().CopyTo(new MemoryStream()), Throws.TypeOf<BadPasswordException>());
        // reading.Password = "password";
        Assert.That(() => firstEntry.Open().CopyTo(new MemoryStream()), Throws.Nothing);
    }

    [Test]
    public async Task CreateZip_WhenNoPasswordSupplied_CreatesUnencryptedZip()
    {
        var writing = new ZipBuilder(null);
        await writing.AddFile("content.txt", "content");

        var bytes = await writing.CreateZip();

        var reading = new ZipArchive(new MemoryStream(bytes), ZipArchiveMode.Read);
        var firstEntry = reading.Entries.First();
        Assert.That(firstEntry.FullName, Is.EqualTo("content.txt"));
        Assert.That(() => firstEntry.Open().CopyTo(new MemoryStream()), Throws.Nothing);
        // reading.Password = "password";
        // Assert.That(() => firstEntry.Open().CopyTo(new MemoryStream()), Throws.Nothing);
    }
}