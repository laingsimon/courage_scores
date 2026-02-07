using CourageScores.Models.Dtos.Data;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Query;
using CourageScores.Services.Data;
using CourageScores.Services.Identity;
using CourageScores.Services.Query;
using Microsoft.Azure.Cosmos;
using Moq;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Query;

[TestFixture]
public class QueryServiceTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private QueryService _service = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<ICosmosTableService> _cosmosTableService = null!;
    private Mock<Database> _database = null!;
    private UserDto? _user;
    private ITableAccessor[] _tables = null!;
    private JToken[] _rows = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _user = null;
        _userService = new Mock<IUserService>();
        _cosmosTableService = new Mock<ICosmosTableService>();
        _database = new Mock<Database>();
        _service = new QueryService(_database.Object, _cosmosTableService.Object, _userService.Object);
        _user = new UserDto
        {
            Access = new()
            {
                RunDataQueries = true,
            },
        };
        _tables =
        [
            TableAccessor("table"),
        ];
        _rows = [];

        _database
            .Setup(d => d.CreateContainerIfNotExistsAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, _token))
            .ReturnsAsync(() => null);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _cosmosTableService.Setup(s => s.GetTables(It.IsAny<ExportDataRequestDto>(), _token)).Returns(() => TestUtilities.AsyncEnumerable(_tables));
    }

    [Test]
    public async Task ExecuteQuery_WhenLoggedOut_ReturnsNotLoggedIn()
    {
        var request = new QueryRequestDto
        {
            Table = "table",
        };
        _user = null;

        var result = await _service.ExecuteQuery(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Not logged in"]));
    }

    [Test]
    public async Task ExecuteQuery_WhenNotPermitted_ReturnsNotPermitted()
    {
        var request = new QueryRequestDto
        {
            Table = "table",
        };
        _user!.Access!.RunDataQueries = false;

        var result = await _service.ExecuteQuery(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Not permitted"]));
    }

    [Test]
    public async Task ExecuteQuery_WhenTableNotFound_ReturnsNotFound()
    {
        _tables = [];
        var request = new QueryRequestDto
        {
            Table = "table",
        };

        var result = await _service.ExecuteQuery(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Table not found"]));
    }

    [TestCase("table")]
    [TestCase("TABLE")]
    public async Task ExecuteQuery_GivenDifferentCasesOfTableName_ReturnsRows(string name)
    {
        var request = new QueryRequestDto
        {
            Table = name,
        };

        var result = await _service.ExecuteQuery(request, _token);

        Assert.That(result.Success, Is.True);
    }

    private ITableAccessor TableAccessor(string tableName)
    {
        var accessor = new Mock<ITableAccessor>();
        accessor.Setup(a => a.TableName).Returns(tableName);
        accessor
            .Setup(a => a.SelectRows(_database.Object, It.IsAny<bool>(), _token))
            .Returns(() => TestUtilities.AsyncEnumerable(_rows));
        return accessor.Object;
    }
}
