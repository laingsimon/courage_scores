using System.IO.Compression;
using System.Security.Cryptography;
using CourageScores.Services.Data;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Data;

[TestFixture]
public class ContentEncryptorTests
{
    [TestCase("")]
    [TestCase("a")]
    [TestCase("12345678901234567890")]
    public async Task CanCreateEncryptedZipAndReadContentFromIt(string password)
    {
        var filePath = "file.path";
        var content = "some content";
        var zipBytes = await CreateZip(password, filePath, content);

        var contentFromEncryptedZip = await GetFileContent(zipBytes, password, filePath);

        Assert.That(contentFromEncryptedZip, Is.EqualTo(content));
    }

    [TestCase("a", "A")]
    [TestCase("a", "aa")]
    public async Task ThrowsIfThePasswordIsIncorrect(string actualPassword, string givenPassword)
    {
        var zipBytes = await CreateZip(actualPassword, "any.path", "content");

        Assert.ThrowsAsync<CryptographicException>(() => GetFileContent(zipBytes, givenPassword, "any.path"));
    }

    private static async Task<byte[]> CreateZip(string password, string path, string content)
    {
        var encryptor = new ContentEncryptor(password);
        var zipStream = new MemoryStream();
        using (var zip = new ZipArchive(zipStream, ZipArchiveMode.Create))
        {
            var unencrypted = new MemoryStream();
            using (var streamWriter = new StreamWriter(unencrypted))
            {
                await streamWriter.WriteAsync(content);
            }

            var entry = zip.CreateEntry(path);
            using (var entryStream = entry.Open())
            {
                var buffer = new MemoryStream(unencrypted.ToArray());
                await encryptor.Encrypt(buffer, entryStream);
            }
        }

        return zipStream.ToArray();
    }

    private static async Task<string> GetFileContent(byte[] zipBytes, string password, string path)
    {
        var zip = new ZipArchive(new MemoryStream(zipBytes), ZipArchiveMode.Read);
        var encryptor = new ContentEncryptor(password);

        var entries = zip.Entries.ToList();
        Assert.That(entries, Is.Not.Empty);
        Assert.That(entries.Select(e => e.FullName), Has.Member(path));
        var entry = zip.GetEntry(path);
        var content = new MemoryStream();
        await entry!.Open().CopyToAsync(content);
        content.Seek(0, SeekOrigin.Begin);

        var decrypted = new MemoryStream();
        await encryptor.Decrypt(content, decrypted);
        decrypted.Seek(0, SeekOrigin.Begin);
        return await new StreamReader(decrypted).ReadToEndAsync();
    }
}