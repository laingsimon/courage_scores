using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Data;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Data;
using CourageScores.Services.Identity;
using Microsoft.Azure.Cosmos;
using Moq;
using Newtonsoft.Json;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Data;

[TestFixture]
public class CosmosTableServiceTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<Database> _database = null!;
    private CosmosTableService _service = null!;
    private List<string> _tables = null!;
    private Mock<IUserService> _userService = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _tables = new List<string>
        {
            nameof(Game),
            nameof(TournamentGame),
            nameof(Team),
        };
        _database = new Mock<Database>();
        _userService = new Mock<IUserService>();
        _service = new CosmosTableService(_database.Object, _userService.Object);
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ExportData = true,
                ImportData = true,
            }
        };
        _database
            .Setup(d => d.GetContainerQueryStreamIterator((string?)null, null, null))
            .Returns(() => new MockFeedIterator(_tables.ToArray()));
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task GetTables_GivenRequestWithNoTables_ReturnsTableAccessorForAllTables(bool loggedIn)
    {
        if (!loggedIn)
        {
            _user = null;
        }
        var request = new ExportDataRequestDto();

        var tableAccessors = await _service.GetTables(request, _token).ToList();

        Assert.That(tableAccessors.Select(a => a.TableName), Is.EquivalentTo(_tables));
    }

    [TestCase(true, nameof(Game))]
    [TestCase(true, "GAME")]
    [TestCase(false, nameof(Game))]
    [TestCase(false, "GAME")]
    public async Task GetTables_GivenRequestWithATableName_ReturnsTableAccessorForGivenTable(bool loggedIn, string requestTable)
    {
        if (!loggedIn)
        {
            _user = null;
        }
        var request = new ExportDataRequestDto
        {
            Tables = { requestTable }
        };

        var tableAccessors = await _service.GetTables(request, _token).ToList();

        Assert.That(tableAccessors.Select(a => a.TableName), Is.EqualTo(new[] { nameof(Game) }));
    }

    [Test]
    public async Task GetTables_WhenNotLoggedIn_ReturnsTableDtoForAllTables()
    {
        _user = null;
        var tables = await _service.GetTables(_token).ToList();

        Assert.That(tables.Select(a => a.Name), Is.EquivalentTo(_tables));
    }

    [Test]
    public async Task GetTables_WhenLoggedIn_ReturnsTableDtoForAllTables()
    {
        var tables = await _service.GetTables(_token).ToList();

        Assert.That(tables.Select(a => a.Name), Is.EquivalentTo(_tables));
    }

    [Test]
    public async Task GetTables_WhenCalled_ReturnsPropertiesForEachTable()
    {
        var tables = await _service.GetTables(_token).ToList();

        Assert.That(tables.Select(a => a.Name), Is.EquivalentTo(_tables));
        Assert.That(tables.Select(a => a.PartitionKey), Has.All.EqualTo("/id"));
        Assert.That(tables.Select(a => a.DataType), Has.All.Not.Null);
    }

    [TestCase(false, false, false, false)]
    [TestCase(false, true, false, true)]
    [TestCase(true, false, false, false)]
    [TestCase(true, true, false, true)]
    public async Task GetTables_WhenDataTypeNotFoundForTable_ReturnsNullDataType(bool canImport, bool canExport, bool expectedCanImport, bool expectedCanExport)
    {
        _user!.Access!.ImportData = canImport;
        _user!.Access!.ExportData = canExport;
        _tables.Add("unknown");

        var tables = await _service.GetTables(_token).ToList();

        var unknownTable = tables.Single(t => t.Name == "unknown");
        Assert.That(unknownTable.Name, Is.EqualTo("unknown"));
        Assert.That(unknownTable.PartitionKey, Is.EqualTo("/id"));
        Assert.That(unknownTable.DataType, Is.Null);
        Assert.That(unknownTable.CanImport, Is.EqualTo(expectedCanImport));
        Assert.That(unknownTable.CanExport, Is.EqualTo(expectedCanExport));
    }

    [Test]
    public async Task GetTables_WhenLoggedOut_ReturnsFalseForCanImportAndExport()
    {
        _user = null;

        var tables = await _service.GetTables(_token).ToList();

        Assert.That(tables.Select(a => a.CanExport), Has.All.False);
        Assert.That(tables.Select(a => a.CanImport), Has.All.False);
    }

    [TestCase(false, true, false, true)]
    [TestCase(false, false, false, false)]
    [TestCase(true, true, true, true)]
    [TestCase(true, false, true, false)]
    public async Task GetTables_WhenLoggedInAndUserCanCreateEditAndDeleteEntity_ReturnsCorrectly(bool canImport, bool canExport, bool expectedCanImport, bool expectedCanExport)
    {
        _user!.Access!.ManageGames = true;
        _user.Access.ImportData = canImport;
        _user.Access.ExportData = canExport;

        var tables = await _service.GetTables(_token).ToList();

        var gameTable = tables.Single(t => t.Name == nameof(Game));
        Assert.That(gameTable.CanImport, Is.EqualTo(expectedCanImport));
        Assert.That(gameTable.CanExport, Is.EqualTo(expectedCanExport));
    }

    [TestCase(false, true, false, true)]
    [TestCase(false, false, false, false)]
    [TestCase(true, true, false, true)]
    [TestCase(true, false, false, false)]
    public async Task GetTables_WhenLoggedInAndUserCannotCreateEditOrDeleteEntity_ReturnsCorrectly(bool canImport, bool canExport, bool expectedCanImport, bool expectedCanExport)
    {
        _user!.Access!.ManageGames = false;
        _user.Access.ImportData = canImport;
        _user.Access.ExportData = canExport;

        var tables = await _service.GetTables(_token).ToList();

        var gameTable = tables.Single(t => t.Name == nameof(Game));
        Assert.That(gameTable.CanImport, Is.EqualTo(expectedCanImport));
        Assert.That(gameTable.CanExport, Is.EqualTo(expectedCanExport));
    }

    private class MockFeedIterator : FeedIterator
    {
        private readonly string[] _tables;
        private bool _hasReadTables;

        public MockFeedIterator(params string[] tables)
        {
            _tables = tables;
        }

        public override async Task<ResponseMessage> ReadNextAsync(CancellationToken cancellationToken = new CancellationToken())
        {
            _hasReadTables = true;

            var stream = new MemoryStream();
            await WriteTableToStream(stream);
            stream.Seek(0, SeekOrigin.Begin);

            return new ResponseMessage
            {
                Content = stream
            };
        }

        private async Task WriteTableToStream(MemoryStream stream)
        {
            var containerItem = new ContainerItemJson
            {
                DocumentCollections = _tables.Select(t => new ContainerItemJson.DocumentCollection
                {
                    Id = t,
                    PartitionKey = new ContainerItemJson.PartitionKeyPaths
                    {
                        Paths = { "/id" }
                    },
                }).ToList(),
            };

            var json = JsonConvert.SerializeObject(containerItem);
            using (var writer = new StreamWriter(stream, leaveOpen: true))
            {
                await writer.WriteAsync(json);
            }
        }

        public override bool HasMoreResults => !_hasReadTables;
    }
}