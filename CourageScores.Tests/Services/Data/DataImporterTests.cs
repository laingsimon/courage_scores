using System.Net;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos.Data;
using CourageScores.Services;
using CourageScores.Services.Data;
using Microsoft.Azure.Cosmos;
using Moq;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Data;

[TestFixture]
public class DataImporterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<Database> _database = null!;
    private Mock<IZipFileReader> _zip = null!;
    private Mock<Container> _container = null!;
    private ImportDataRequestDto _request = null!;
    private ImportDataResultDto _result = null!;
    private List<TableDto> _currentTables = null!;
    private DataImporter _importer = null!;
    private List<string> _zipFiles = null!;
    private ItemResponse<JObject> _upsertResult = null!;
    private JObject _fileContent = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _database = new Mock<Database>();
        _request = new ImportDataRequestDto();
        _result = new ImportDataResultDto();
        _zip = new Mock<IZipFileReader>();
        _fileContent = JObject.FromObject(new Division());
        _zipFiles = new List<string>
        {
            "8AEDEC81-8D28-475B-893E-A34FC60FB0C2.json",
        };
        _container = new Mock<Container>();
        _currentTables = new List<TableDto>
        {
            new TableDto
            {
                Name = "TABLE",
                PartitionKey = "/id"
            }
        };
        _upsertResult = new MockItemResponse<JObject>(statusCode: HttpStatusCode.Created);
        _importer = new DataImporter(_database.Object, _request, _result, _currentTables);
        _database
            .Setup(d => d.CreateContainerIfNotExistsAsync("TABLE", "/id", null, null, _token))
            .ReturnsAsync(new MockContainerResponse(_container));
        _database
            .Setup(d => d.CreateContainerIfNotExistsAsync("TABLE_import", "/id", null, null, _token))
            .ReturnsAsync(new MockContainerResponse(_container));
        _zip.Setup(z => z.EnumerateFiles("TABLE")).Returns(() => _zipFiles);
        _zip.Setup(z => z.ReadJson<JObject>(It.IsAny<string>())).ReturnsAsync(() => _fileContent);
        _container
            .Setup(c => c.UpsertItemAsync(It.Is<JObject>(obj => obj == _fileContent), null, null, _token))
            .ReturnsAsync(() => _upsertResult);
    }

    [Test]
    public async Task ImportData_GivenUnmatchedTable_IgnoresTable()
    {
        var tablesToImport = new[]
        {
            "TABLE1"
        };

        var result = await _importer.ImportData(tablesToImport, _zip.Object, _token).ToList();

        Assert.That(result, Is.Empty);
    }

    [TestCase("table")]
    [TestCase("TABLE")]
    public async Task ImportData_GivenMatchedTable_ProcessesTable(string tableToImport)
    {
        var tablesToImport = new[]
        {
            tableToImport
        };

        var result = await _importer.ImportData(tablesToImport, _zip.Object, _token).ToList();

        Assert.That(result, Is.Not.Empty);
        Assert.That(result, Has.None.StartsWith("ERROR"));
    }

    [Test]
    public async Task ImportData_GivenNoTableFilter_ImportsData()
    {
        var result = await _importer.ImportData(Array.Empty<string>(), _zip.Object, _token).ToList();

        _container.Verify(c => c.UpsertItemAsync(It.IsAny<JObject>(), null, null, _token));
        Assert.That(result, Is.Not.Empty);
        Assert.That(result, Has.None.StartsWith("ERROR"));
    }

    [Test]
    public async Task ImportData_WhenDryRun_CreatesDryRunTable()
    {
        _request.DryRun = true;

        var result = await _importer.ImportData(Array.Empty<string>(), _zip.Object, _token).ToList();

        _database.Verify(d => d.CreateContainerIfNotExistsAsync("TABLE_import", "/id", null, null, _token));
        Assert.That(result, Is.Not.Empty);
        Assert.That(result, Has.None.StartsWith("ERROR"));
    }

    [Test]
    public async Task ImportData_WhenNotDryRun_GetsProductionTable()
    {
        _request.DryRun = false;

        var result = await _importer.ImportData(Array.Empty<string>(), _zip.Object, _token).ToList();

        _database.Verify(d => d.CreateContainerIfNotExistsAsync("TABLE", "/id", null, null, _token));
        Assert.That(result, Is.Not.Empty);
        Assert.That(result, Has.None.StartsWith("ERROR"));
    }

    [Test]
    public async Task ImportData_WhenDryRun_DeletesImportTable()
    {
        _request.DryRun = true;

        var result = await _importer.ImportData(Array.Empty<string>(), _zip.Object, _token).ToList();

        _container.Verify(c => c.DeleteContainerAsync(null, _token));
        Assert.That(result, Is.Not.Empty);
        Assert.That(result, Has.None.StartsWith("ERROR"));
    }

    [Test]
    public async Task ImportData_WhenNotDryRun_DoesNotDeleteTable()
    {
        _request.DryRun = false;

        var result = await _importer.ImportData(Array.Empty<string>(), _zip.Object, _token).ToList();

        _container.Verify(c => c.DeleteContainerAsync(null, _token), Times.Never);
        Assert.That(result, Is.Not.Empty);
        Assert.That(result, Has.None.StartsWith("ERROR"));
    }

    [TestCase(HttpStatusCode.Created)]
    [TestCase(HttpStatusCode.OK)]
    public async Task ImportData_WhenRecordIsCreated_ReturnsSuccess(HttpStatusCode statusCode)
    {
        _upsertResult = new MockItemResponse<JObject>(statusCode: statusCode);

        var result = await _importer.ImportData(Array.Empty<string>(), _zip.Object, _token).ToList();

        _container.Verify(c => c.UpsertItemAsync(It.IsAny<JObject>(), null, null, _token));
        Assert.That(result, Is.Not.Empty);
        Assert.That(result, Has.None.StartsWith("ERROR"));
    }

    [Test]
    public async Task ImportData_WhenRecordIsNotCreated_ReturnsError()
    {
        _upsertResult = new MockItemResponse<JObject>(statusCode: HttpStatusCode.NotAcceptable);

        var result = await _importer.ImportData(Array.Empty<string>(), _zip.Object, _token).ToList();

        _container.Verify(c => c.UpsertItemAsync(It.IsAny<JObject>(), null, null, _token));
        Assert.That(result, Is.Not.Empty);
        Assert.That(result, Has.Some.EqualTo("ERROR: Could not import row: NotAcceptable"));
    }

    [Test]
    public async Task ImportData_WhenRecordIsCreated_IncrementsRecordCount()
    {
        _zipFiles.Add("5AA21DA5-EFB8-4E1B-B3BE-28486A6946BE.json");

        var result = await _importer.ImportData(Array.Empty<string>(), _zip.Object, _token).ToList();

        Assert.That(result, Is.Not.Empty);
        Assert.That(result, Has.None.StartsWith("ERROR"));
        Assert.That(_result.Tables["TABLE"], Is.EqualTo(2));
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task PurgeData_GivenUnmatchedTable_IgnoresTable(bool dryRun)
    {
        _request.DryRun = dryRun;
        var tablesToImport = new[]
        {
            "TABLE1"
        };

        var result = await _importer.PurgeData(tablesToImport, _token).ToList();

        _database.Verify(d => d.GetContainer(It.IsAny<string>()), Times.Never);
        _container.Verify(c => c.DeleteContainerAsync(null, _token), Times.Never);
        Assert.That(result, Is.Empty);
    }

    [TestCase("table")]
    [TestCase("TABLE")]
    public async Task PurgeData_GivenMatchedTable_PurgesData(string tableToImport)
    {
        _request.DryRun = false;
        _database.Setup(d => d.GetContainer("TABLE")).Returns(_container.Object);
        var tablesToImport = new[]
        {
            tableToImport
        };

        var result = await _importer.PurgeData(tablesToImport, _token).ToList();

        Assert.That(result, Is.Not.Empty);
        Assert.That(result, Has.Some.Matches("Purging data in TABLE"));
        _container.Verify(c => c.DeleteContainerAsync(null, _token));
    }

    [TestCase("table")]
    [TestCase("TABLE")]
    public async Task PurgeData_GivenMatchedTableAndDryRun_DoesNotPurgeData(string tableToImport)
    {
        _request.DryRun = true;
        _database.Setup(d => d.GetContainer("TABLE")).Returns(_container.Object);
        var tablesToImport = new[]
        {
            tableToImport
        };

        var result = await _importer.PurgeData(tablesToImport, _token).ToList();

        Assert.That(result, Is.Not.Empty);
        Assert.That(result, Has.Some.Matches("Purging data in TABLE"));
        _container.Verify(c => c.DeleteContainerAsync(null, _token), Times.Never);
    }

    [Test]
    public async Task PurgeData_GivenNoTableFilter_PurgesData()
    {
        _request.DryRun = false;
        _database.Setup(d => d.GetContainer("TABLE")).Returns(_container.Object);

        var result = await _importer.PurgeData(Array.Empty<string>(), _token).ToList();

        Assert.That(result, Is.Not.Empty);
        Assert.That(result, Has.Some.Matches("Purging data in TABLE"));
        _container.Verify(c => c.DeleteContainerAsync(null, _token));
    }

    [Test]
    public async Task PurgeData_GivenNoTableFilterAndDryRun_DoesNotPurgeData()
    {
        _request.DryRun = true;
        _database.Setup(d => d.GetContainer("TABLE")).Returns(_container.Object);

        var result = await _importer.PurgeData(Array.Empty<string>(), _token).ToList();

        Assert.That(result, Is.Not.Empty);
        Assert.That(result, Has.Some.Matches("Purging data in TABLE"));
        _container.Verify(c => c.DeleteContainerAsync(null, _token), Times.Never);
    }
}