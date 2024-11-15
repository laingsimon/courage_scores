using System.IO.Compression;
using CourageScores.Services;
using CourageScores.Services.Data;
using Newtonsoft.Json;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Data;

[TestFixture]
public class ZipFileReaderTests
{
    private readonly IJsonSerializerService _serializer = new JsonSerializerService(new JsonSerializer());

    [TestCase("file.ext")]
    [TestCase("FILE.ext")]
    public void HasFile_WhenFileExists_ReturnsTrue(string fileName)
    {
        var zip = CreateZip("file.ext");
        var reader = new ZipFileReader(zip, _serializer, NullContentEncryptor.Instance);

        var result = reader.HasFile(fileName);

        Assert.That(result, Is.True);
    }

    [Test]
    public void HasFile_WhenFileDoesNotExist_ReturnsFalse()
    {
        var zip = CreateZip("file.ext");
        var reader = new ZipFileReader(zip, _serializer, NullContentEncryptor.Instance);

        var result = reader.HasFile("other_file.ext");

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task ReadJson_WhenFileExists_DeserialisesContent()
    {
        var zip = CreateZip("file.ext");
        var reader = new ZipFileReader(zip, _serializer, NullContentEncryptor.Instance);

        var result = await reader.ReadJson<ExportMetaData>("file.ext");

        Assert.That(result, Is.Not.Null);
    }

    [Test]
    public void ReadJson_WhenFileDoesNotExist_ThrowsFileNotFound()
    {
        var zip = CreateZip("file.ext");
        var reader = new ZipFileReader(zip, _serializer, NullContentEncryptor.Instance);

        Assert.ThrowsAsync<FileNotFoundException>(() => reader.ReadJson<ExportMetaData>("another_file.ext"));
    }

    [Test]
    public void EnumerateFiles_GivenPath_ReturnsFilesWithinPath()
    {
        var zip = CreateZip("folder1/file1.ext", "folder1/file2.ext");
        var reader = new ZipFileReader(zip, _serializer, NullContentEncryptor.Instance);

        var result = reader.EnumerateFiles("folder1");

        Assert.That(result, Is.EquivalentTo(new[]
        {
            "folder1/file1.ext", "folder1/file2.ext",
        }));
    }

    [Test]
    public void EnumerateFiles_GivenPath_DoesNotReturnFilesFromRoot()
    {
        var zip = CreateZip("root.ext", "folder1/file1.ext", "folder1/file2.ext");
        var reader = new ZipFileReader(zip, _serializer, NullContentEncryptor.Instance);

        var result = reader.EnumerateFiles("folder1");

        Assert.That(result, Is.EquivalentTo(new[]
        {
            "folder1/file1.ext", "folder1/file2.ext",
        }));
    }

    [Test]
    public void EnumerateFiles_GivenPath_DoesNotReturnFilesFromAnotherDirectory()
    {
        var zip = CreateZip("folder1/file1.ext", "folder1/file2.ext", "folder2/file3.ext");
        var reader = new ZipFileReader(zip, _serializer, NullContentEncryptor.Instance);

        var result = reader.EnumerateFiles("folder1");

        Assert.That(result, Is.EquivalentTo(new[]
        {
            "folder1/file1.ext", "folder1/file2.ext",
        }));
    }

    private ZipArchive CreateZip(params string[] filePaths)
    {
        var stream = new MemoryStream();
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Create))
        {
            var content = _serializer.SerialiseToString(new ExportMetaData
            {
                Creator = "USER",
            });

            foreach (var path in filePaths)
            {
                var entry = zip.CreateEntry(path);
                using (var writer = new StreamWriter(entry.Open()))
                {
                    writer.WriteAsync(content);
                }
            }
        }

        return new ZipArchive(new MemoryStream(stream.ToArray()));
    }
}