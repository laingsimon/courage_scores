using CourageScores.Models.Dtos.Data;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Data;
using CourageScores.Services.Identity;
using Ionic.Zip;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Data;

[TestFixture]
public class DataServiceTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private DataService _dataService = null!;
    private Mock<Database> _database = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<IZipFileReaderFactory> _zipFileReaderFactory = null!;
    private Mock<IDataImporterFactory> _dataImporterFactory = null!;
    private Mock<ICosmosTableService> _cosmosTableService = null!;
    private Mock<IZipBuilderFactory> _zipBuilderFactory = null!;
    private Mock<IZipBuilder> _zipBuilder = null!;
    private Mock<IZipFileReader> _importZip = null!;
    private UserDto? _user;
    private ExportDataRequestDto _exportRequest = null!;
    private ITableAccessor[] _tables = Array.Empty<ITableAccessor>();
    private ImportDataRequestDto _importRequest = null!;
    private Mock<IDataImporter> _tableImporter = null!;
    private ExportMetaData _importMetaData = null!;
    private Mock<IConfiguration> _configuration = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _database = new Mock<Database>();
        _userService = new Mock<IUserService>();
        _zipBuilderFactory = new Mock<IZipBuilderFactory>();
        _cosmosTableService = new Mock<ICosmosTableService>();
        _dataImporterFactory = new Mock<IDataImporterFactory>();
        _zipFileReaderFactory = new Mock<IZipFileReaderFactory>();
        _zipBuilder = new Mock<IZipBuilder>();
        _importZip = new Mock<IZipFileReader>();
        _tableImporter = new Mock<IDataImporter>();
        _configuration = new Mock<IConfiguration>();
        _exportRequest = new ExportDataRequestDto();
        _importRequest = new ImportDataRequestDto
        {
            Zip = new FormFile(new MemoryStream(), 0, 10, "name", "fileName.zip"),
            Password = "correct password",
        };
        _user = new UserDto
        {
            Name = "USER",
            Access = new AccessDto
            {
                ExportData = true,
                ImportData = true,
            }
        };
        _importMetaData = new ExportMetaData
        {
            Hostname = "HOST",
        };
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _zipBuilderFactory.Setup(f => f.Create("USER", _exportRequest, _token)).ReturnsAsync(_zipBuilder.Object);
        _cosmosTableService
            .Setup(s => s.GetTables(_exportRequest, _token))
            .Returns(() => TestUtilities.AsyncEnumerable(_tables));
        _zipFileReaderFactory
            .Setup(f => f.Create(It.IsAny<Stream>(), "correct password"))
            .ReturnsAsync(() => _importZip.Object);
        _zipFileReaderFactory
            .Setup(f => f.Create(It.IsAny<Stream>(), It.Is<string>(p => p != "correct password")))
            .Throws(() => new BadPasswordException());
        _dataImporterFactory
            .Setup(f => f.Create(_importRequest, It.IsAny<ImportDataResultDto>(), It.IsAny<IAsyncEnumerable<TableDto>>()))
            .ReturnsAsync(_tableImporter.Object);
        _importZip.Setup(z => z.ReadJson<ExportMetaData>(ExportMetaData.FileName))
            .ReturnsAsync(_importMetaData);

        _dataService = new DataService(
            _database.Object,
            _userService.Object,
            _zipFileReaderFactory.Object,
            _dataImporterFactory.Object,
            _cosmosTableService.Object,
            _zipBuilderFactory.Object,
            _configuration.Object);
    }

    [Test]
    public async Task ExportData_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        _user = null;

        var result = await _dataService.ExportData(_exportRequest, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("Not logged in"));
    }

    [Test]
    public async Task ExportData_WhenNotPermitted_ReturnsUnsuccessful()
    {
        _user!.Access!.ExportData = false;

        var result = await _dataService.ExportData(_exportRequest, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("Not permitted"));
    }

    [Test]
    public async Task ExportData_WhenAnExceptionOccurs_ReturnsUnsuccessful()
    {
        _zipBuilderFactory
            .Setup(f => f.Create("USER", _exportRequest, _token))
            .Throws(() => new InvalidOperationException("some error"));

        var result = await _dataService.ExportData(_exportRequest, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("some error"));
    }

    [Test]
    public async Task ExportData_WhenCreatingAZipWithAPassword_PassesCorrectPassword()
    {
        _exportRequest.Password = "password";

        await _dataService.ExportData(_exportRequest, _token);

        _zipBuilderFactory.Verify(f => f.Create("USER", _exportRequest, _token));
    }

    [Test]
    public async Task ExportData_WhenCreatingAZipWithoutAPassword_PassesNullPassword()
    {
        await _dataService.ExportData(_exportRequest, _token);

        _zipBuilderFactory.Verify(f => f.Create("USER", _exportRequest, _token));
    }

    [Test]
    public async Task ExportData_WhenTablesReturned_ExportsEachTable()
    {
        var table = new Mock<ITableAccessor>();
        _tables = new[] { table.Object };

        await _dataService.ExportData(_exportRequest, _token);

        _cosmosTableService.Verify(s => s.GetTables(_exportRequest, _token));
        table.Verify(t => t.ExportData(_database.Object, It.IsAny<ExportDataResultDto>(), _zipBuilder.Object, _exportRequest, _token));
    }

    [Test]
    public async Task ExportData_WhenZipCreated_SetsZipInResult()
    {
        var zipBytes = new byte[] { 0, 1, 2 };
        _zipBuilder.Setup(z => z.CreateZip()).ReturnsAsync(zipBytes);

        var result = await _dataService.ExportData(_exportRequest, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.Zip, Is.SameAs(zipBytes));
    }

    [Test]
    public async Task ImportData_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        _user = null;

        var result = await _dataService.ImportData(_importRequest, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("Not logged in"));
    }

    [Test]
    public async Task ImportData_WhenNotPermitted_ReturnsUnsuccessful()
    {
        _user!.Access!.ImportData = false;

        var result = await _dataService.ImportData(_importRequest, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("Not permitted"));
    }

    [Test]
    public async Task ImportData_WhenPasswordIncorrect_ReturnsUnsuccessful()
    {
        _importRequest.Password = "incorrect password";

        var result = await _dataService.ImportData(_importRequest, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("Password is incorrect"));
    }

    [Test]
    public async Task ImportData_WhenErrorOccurs_ReturnsUnsuccessful()
    {
        _importZip = new Mock<IZipFileReader>();
        _importZip.Setup(z => z.HasFile(It.IsAny<string>())).Returns(true);
        _importZip
            .Setup(z => z.ReadJson<ExportMetaData>(It.IsAny<string>()))
            .Throws(() => new InvalidOperationException("some error"));

        var result = await _dataService.ImportData(_importRequest, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("some error"));
    }

    [Test]
    public async Task ImportData_WithoutMetaFile_ReturnsUnsuccessful()
    {
        _importZip.Setup(z => z.HasFile(ExportMetaData.FileName)).Returns(false);

        var result = await _dataService.ImportData(_importRequest, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("Zip file does not contain a meta.json file"));
    }

    [Test]
    public async Task ImportData_WithV2PartialDataExportAndPurge_ReturnsUnsuccessful()
    {
        _importZip.Setup(z => z.HasFile(ExportMetaData.FileName)).Returns(true);
        _importRequest.PurgeData = true;
        _importMetaData.RequestedTables.Add("TABLE 1", new List<Guid>(new[] { Guid.Empty }));

        var result = await _dataService.ImportData(_importRequest, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("Purge is not permitted for partial data exports"));
    }

    [Test]
    public async Task ImportData_WithPurgeDataRequested_PurgesData()
    {
        _importZip.Setup(z => z.HasFile(ExportMetaData.FileName)).Returns(true);
        _importRequest.PurgeData = true;
        _tableImporter
            .Setup(i => i.ImportData(It.IsAny<IReadOnlyCollection<string>>(), _importZip.Object, _token))
            .Returns(TestUtilities.AsyncEnumerable("import message1"));
        _tableImporter
            .Setup(i => i.PurgeData(It.IsAny<IReadOnlyCollection<string>>(), _token))
            .Returns(TestUtilities.AsyncEnumerable("purge message1"));

        var result = await _dataService.ImportData(_importRequest, _token);

        _tableImporter.Verify(i => i.PurgeData(It.IsAny<IReadOnlyCollection<string>>(), _token));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Has.Member("purge message1"));
    }

    [Test]
    public async Task ImportData_WithoutPurgeDataRequested_DoesNotPurgeData()
    {
        _importZip.Setup(z => z.HasFile(ExportMetaData.FileName)).Returns(true);
        _importRequest.PurgeData = false;
        _tableImporter
            .Setup(i => i.ImportData(It.IsAny<IReadOnlyCollection<string>>(), _importZip.Object, _token))
            .Returns(TestUtilities.AsyncEnumerable("import message1"));

        var result = await _dataService.ImportData(_importRequest, _token);

        _tableImporter.Verify(i => i.PurgeData(It.IsAny<IReadOnlyCollection<string>>(), _token), Times.Never);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Has.Member("import message1"));
    }

    [Test]
    public async Task ImportData_WhenComplete_ImportsData()
    {
        _importZip.Setup(z => z.HasFile(ExportMetaData.FileName)).Returns(true);
        _tableImporter
            .Setup(i => i.ImportData(It.IsAny<IReadOnlyCollection<string>>(), _importZip.Object, _token))
            .Returns(TestUtilities.AsyncEnumerable("import message1"));

        var result = await _dataService.ImportData(_importRequest, _token);

        _tableImporter.Verify(i => i.ImportData(It.IsAny<IReadOnlyCollection<string>>(), _importZip.Object, _token));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Has.Member("import message1"));
    }

    [TestCase("")]
    [TestCase(null)]
    public async Task BackupData_GivenNoRequestToken_ReturnsUnsuccessful(string requestToken)
    {
        var request = new BackupDataRequestDto
        {
            Identity = "someone",
            RequestToken = requestToken,
        };

        var result = await _dataService.BackupData(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Invalid request token" }));
    }

    [TestCase("")]
    [TestCase(null)]
    public async Task BackupData_GivenNoIdentity_ReturnsUnsuccessful(string identity)
    {
        var request = new BackupDataRequestDto
        {
            Identity = identity,
            RequestToken = "correct",
        };

        var result = await _dataService.BackupData(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Missing identity" }));
    }

    [TestCase("incorrect")]
    [TestCase("CoRReCT")]
    public async Task BackupData_GivenIncorrectRequestToken_ReturnsUnsuccessful(string requestToken)
    {
        var request = new BackupDataRequestDto
        {
            Identity = "someone",
            RequestToken = requestToken,
        };
        _configuration.Setup(c => c["BackupRequestToken"]).Returns("Correct");

        var result = await _dataService.BackupData(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Invalid request token" }));
    }

    [Test]
    public async Task BackupData_GivenCorrectRequestToken_ReturnsSuccessful()
    {
        var request = new BackupDataRequestDto
        {
            Identity = "someone",
            RequestToken = "Correct",
        };
        _configuration.Setup(c => c["BackupRequestToken"]).Returns("Correct");
        _zipBuilderFactory
            .Setup(f => f.Create("someone", It.IsAny<ExportDataRequestDto>(), _token))
            .ReturnsAsync(_zipBuilder.Object);
        _cosmosTableService
            .Setup(s => s.GetTables(It.IsAny<ExportDataRequestDto>(), _token))
            .Returns(TestUtilities.AsyncEnumerable<ITableAccessor>());

        var result = await _dataService.BackupData(request, _token);

        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task BackupData_GivenCorrectRequestToken_CreatesZipWithCorrectPassword()
    {
        var request = new BackupDataRequestDto
        {
            Identity = "someone",
            RequestToken = "Correct",
        };
        _configuration.Setup(c => c["BackupRequestToken"]).Returns("Correct");
        _configuration.Setup(c => c["BackupPassword"]).Returns("ZipPassword");
        _zipBuilderFactory
            .Setup(f => f.Create("USER", It.IsAny<ExportDataRequestDto>(), _token))
            .ReturnsAsync(_zipBuilder.Object);
        _cosmosTableService
            .Setup(s => s.GetTables(It.IsAny<ExportDataRequestDto>(), _token))
            .Returns(TestUtilities.AsyncEnumerable<ITableAccessor>());

        await _dataService.BackupData(request, _token);

        _zipBuilderFactory.Verify(f => f.Create("someone", It.Is<ExportDataRequestDto>(r => r.Password == "ZipPassword"), _token));
    }
}