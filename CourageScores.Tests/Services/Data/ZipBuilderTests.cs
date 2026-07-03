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
        var zip = new ZipBuilder(NullContentEncryptor.Instance);

        await zip.AddFile("table", "id", JObject.FromObject(new CourageScores.Models.Cosmos.Division()));

        await using var archive = new ZipArchive(new MemoryStream(await zip.CreateZip()));
        var files = archive.Entries.Select(e => e.FullName);
        Assert.That(files, Is.EqualTo(["table/id.json"]));
    }

    [Test]
    public async Task CreateZip_WhenPasswordSupplied_CreatesEncryptedZip()
    {
        var encryptor = new ContentEncryptor("password");
        var writing = new ZipBuilder(encryptor);
        await writing.AddFile("content.txt", "content");

        var bytes = await writing.CreateZip();

        await using var reading = new ZipArchive(new MemoryStream(bytes), ZipArchiveMode.Read);
        var firstEntry = reading.Entries.First();
        Assert.That(firstEntry.FullName, Is.EqualTo("content.txt"));
        using var fileContent = new MemoryStream();
        await (await firstEntry.OpenAsync()).CopyToAsync(fileContent);
        fileContent.Seek(0, SeekOrigin.Begin);
        using var decrypted = new MemoryStream();
        await encryptor.Decrypt(fileContent, decrypted);
        Assert.That(System.Text.Encoding.UTF8.GetString(decrypted.ToArray()), Is.EqualTo("content"));
    }

    [Test]
    public async Task CreateZip_WhenNoPasswordSupplied_CreatesUnencryptedZip()
    {
        var writing = new ZipBuilder(NullContentEncryptor.Instance);
        await writing.AddFile("content.txt", "content");

        var bytes = await writing.CreateZip();

        await using var reading = new ZipArchive(new MemoryStream(bytes), ZipArchiveMode.Read);
        var firstEntry = reading.Entries.First();
        Assert.That(firstEntry.FullName, Is.EqualTo("content.txt"));
        using var fileContent = new MemoryStream();
        await (await firstEntry.OpenAsync()).CopyToAsync(fileContent);
        Assert.That(System.Text.Encoding.UTF8.GetString(fileContent.ToArray()), Is.EqualTo("content"));
    }
}
