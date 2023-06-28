using System.Text;
using CourageScores.Models.Dtos.Data;
using CourageScores.Services.Data;
using Microsoft.Azure.Cosmos;
using Moq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Data;

[TestFixture]
public class TableAccessorTests
{
    private static readonly JsonSerializer Serializer = new JsonSerializer();
    private readonly CancellationToken _token = new CancellationToken();
    private readonly TableAccessor _accessor = new TableAccessor("TABLE");
    private Mock<Database> _database = null!;
    private Mock<IZipBuilder> _builder = null!;
    private ExportDataResultDto _result = null!;
    private ExportDataRequestDto _request = null!;
    private Mock<Container> _container = null!;
    private FeedIterator<JObject> _iterator = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _database = new Mock<Database>();
        _builder = new Mock<IZipBuilder>();
        _result = new ExportDataResultDto();
        _request = new ExportDataRequestDto();
        _container = new Mock<Container>();

        _container
            .Setup(c => c.GetItemQueryIterator<JObject>(It.IsAny<string>(), null, null))
            .Returns(() => _iterator);
        _database
            .Setup(d => d.CreateContainerIfNotExistsAsync("TABLE", "/id", null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new MockContainerResponse(_container));
    }

    [Test]
    public async Task ExportData_GivenNoData_AddsTableToSet()
    {
        _iterator = new MockFeedIterator<JObject>();

        await _accessor.ExportData(_database.Object, _result, _builder.Object, _request, _token);

        Assert.That(_result.Tables.Keys, Has.Member("TABLE"));
        Assert.That(_result.Tables["TABLE"], Is.EqualTo(0));
    }

    [Test]
    public async Task ExportData_GivenSomeData_RecordsRowCount()
    {
        _iterator = new MockFeedIterator<JObject>(Row());

        await _accessor.ExportData(_database.Object, _result, _builder.Object, _request, _token);

        Assert.That(_result.Tables["TABLE"], Is.EqualTo(1));
    }

    [Test]
    public async Task ExportData_GivenSomeData_DoesNotExportDeletedRows()
    {
        _iterator = new MockFeedIterator<JObject>(Row(deleted: new DateTime(2001, 02, 03)));
        _request.IncludeDeletedEntries = false;

        await _accessor.ExportData(_database.Object, _result, _builder.Object, _request, _token);

        Assert.That(_result.Tables["TABLE"], Is.EqualTo(0));
    }

    [Test]
    public async Task ExportData_GivenSomeData_IncludesDeletedRows()
    {
        _iterator = new MockFeedIterator<JObject>(Row(deleted: new DateTime(2001, 02, 03)));
        _request.IncludeDeletedEntries = true;

        await _accessor.ExportData(_database.Object, _result, _builder.Object, _request, _token);

        Assert.That(_result.Tables["TABLE"], Is.EqualTo(1));
    }

    [Test]
    public async Task ExportData_GivenSomeIdsToExport_OnlyExportsGivenIds()
    {
        var id = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        _iterator = new MockFeedIterator<JObject>(Row(id: id), Row(id: otherId));
#pragma warning disable CS0618
        _request.Tables.Add("table", new List<Guid> { id });
#pragma warning restore CS0618

        await _accessor.ExportData(_database.Object, _result, _builder.Object, _request, _token);

        Assert.That(_result.Tables["TABLE"], Is.EqualTo(1));
        _builder.Verify(b => b.AddFile("TABLE", id.ToString(), It.IsAny<JObject>()));
        _builder.Verify(b => b.AddFile("TABLE", otherId.ToString(), It.IsAny<JObject>()), Times.Never);
    }

    [Test]
    public async Task ExportData_GivenEmptyIdsToExport_ExportsAllIds()
    {
        var id = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        _iterator = new MockFeedIterator<JObject>(Row(id: id), Row(id: otherId));
#pragma warning disable CS0618
        _request.Tables.Add("table", new List<Guid>());
#pragma warning restore CS0618

        await _accessor.ExportData(_database.Object, _result, _builder.Object, _request, _token);

        Assert.That(_result.Tables["TABLE"], Is.EqualTo(2));
    }

    [Test]
    public async Task ExportData_GivenNoIdsToExport_ExportsAllIds()
    {
        var id = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        _iterator = new MockFeedIterator<JObject>(Row(id: id), Row(id: otherId));

        await _accessor.ExportData(_database.Object, _result, _builder.Object, _request, _token);

        Assert.That(_result.Tables["TABLE"], Is.EqualTo(2));
    }

    [Test]
    public async Task ExportData_WhenCancelledBetweenBatches_AbortsEarly()
    {
        var tokenSource = new CancellationTokenSource();
        _iterator = new MockFeedIterator<JObject>(
            Row(), Row(), Row(), Row())
        {
            BatchSize = 2,
            AtEndOfBatch = () => tokenSource.Cancel(),
        };
        _request.IncludeDeletedEntries = true;

        await _accessor.ExportData(_database.Object, _result, _builder.Object, _request, tokenSource.Token);

        Assert.That(_result.Tables["TABLE"], Is.EqualTo(2));
    }

    [Test]
    public async Task ExportData_WhenCancelledWithinBatch_AbortsEarly()
    {
        var index = 0;
        var tokenSource = new CancellationTokenSource();
        _iterator = new MockFeedIterator<JObject>(
            Row(), Row(), Row(), Row())
        {
            BatchSize = 2,
            BeforeRecord = () => { if (index++ > 0) { tokenSource.Cancel(); } },
        };
        _request.IncludeDeletedEntries = true;

        await _accessor.ExportData(_database.Object, _result, _builder.Object, _request, tokenSource.Token);

        Assert.That(_result.Tables["TABLE"], Is.EqualTo(1));
    }

    [Test]
    public async Task ExportData_WhenNotCancelledWithMultipleBatches_ReturnsAllRows()
    {
        _iterator = new MockFeedIterator<JObject>(
            Row(), Row(), Row(), Row())
        {
            BatchSize = 2,
        };
        _request.IncludeDeletedEntries = true;

        await _accessor.ExportData(_database.Object, _result, _builder.Object, _request, _token);

        Assert.That(_result.Tables["TABLE"], Is.EqualTo(4));
    }

    private static JObject Row(Guid? id = null, DateTime? deleted = null)
    {
        var row = new CourageScores.Models.Cosmos.Division
        {
            Deleted = deleted,
            Id = id ?? Guid.NewGuid(),
        };

        var stringBuilder = new StringBuilder();
        Serializer.Serialize(new StringWriter(stringBuilder), row);

        return Serializer.Deserialize<JObject>(new JsonTextReader(new StringReader(stringBuilder.ToString())));
    }
}