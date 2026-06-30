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

        try
        {
            var content = await GetFileContent(zipBytes, givenPassword, "any.path");
            // ReSharper disable once NullCoalescingConditionIsAlwaysNotNullAccordingToAPIContract
            Assert.Fail($"Expected attempt to decrypt content of zip to fail, instead got the following content: {content ?? "<null>"} (${content?.Length} byte/s)");
        }
        catch (CryptographicException)
        {
            Assert.Pass();
        }
    }

    private static async Task<byte[]> CreateZip(string password, string path, string content)
    {
        var encryptor = new ContentEncryptor(password);
        var zipStream = new MemoryStream();
        await using (var zip = new ZipArchive(zipStream, ZipArchiveMode.Create))
        {
            var unencrypted = new MemoryStream();
            await using (var streamWriter = new StreamWriter(unencrypted))
            {
                await streamWriter.WriteAsync(content);
            }

            var entry = zip.CreateEntry(path);
            await using (var entryStream = await entry.OpenAsync())
            {
                var buffer = new MemoryStream(unencrypted.ToArray());
                await encryptor.Encrypt(buffer, entryStream);
            }
        }

        return zipStream.ToArray();
    }

    private static async Task<string> GetFileContent(byte[] zipBytes, string password, string path)
    {
        await using var zip = new ZipArchive(new MemoryStream(zipBytes), ZipArchiveMode.Read);
        var encryptor = new ContentEncryptor(password);

        var entries = zip.Entries.ToList();
        Assert.That(entries, Is.Not.Empty);
        Assert.That(entries.Select(e => e.FullName), Has.Member(path));
        var entry = zip.GetEntry(path);
        using var content = new MemoryStream();
        await (await entry!.OpenAsync()).CopyToAsync(content);
        content.Seek(0, SeekOrigin.Begin);

        using var decrypted = new MemoryStream();
        await encryptor.Decrypt(content, decrypted);
        decrypted.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(decrypted);
        return await reader.ReadToEndAsync();
    }
}
