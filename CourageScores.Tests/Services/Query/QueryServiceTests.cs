using CourageScores.Models.Dtos.Data;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Query;
using CourageScores.Services.Data;
using CourageScores.Services.Identity;
using CourageScores.Services.Query;
using Microsoft.Azure.Cosmos;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Query;

[TestFixture]
public class QueryServiceTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private QueryService _service = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<Database> _database = null!;
    private Mock<ICosmosTableService> _cosmosTableService = null!;
    private UserDto? _user;
    private TableDto[] _tables = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _user = null;
        _userService = new Mock<IUserService>();
        _database = new Mock<Database> { DefaultValue = DefaultValue.Mock };
        _cosmosTableService = new Mock<ICosmosTableService>();
        _service = new QueryService(_database.Object, _userService.Object, _cosmosTableService.Object);
        _user = new UserDto
        {
            Access = new()
            {
                RunDataQueries = true,
            },
        };
        _tables = new[]
        {
            new TableDto {Name = "game"},
        };

        _database
            .Setup(d => d.CreateContainerIfNotExistsAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, _token))
            .ReturnsAsync(() => null);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _cosmosTableService
            .Setup(s => s.GetTables(_token))
            .Returns(() => TestUtilities.AsyncEnumerable(_tables));
    }

    [Test]
    public async Task ExecuteQuery_WhenLoggedOut_ReturnsNotLoggedIn()
    {
        var request = new QueryRequestDto
        {
            Container = "game",
            Query = "select * from game",
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
            Container = "game",
            Query = "select * from game",
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
            Container = "game",
            Query = "select * from game",
        };

        var result = await _service.ExecuteQuery(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Table not found"]));
    }

    [TestCase("game")]
    [TestCase("GAME")]
    public async Task ExecuteQuery_GivenDifferentCasesOfTableName_ReturnsRows(string name)
    {
        var request = new QueryRequestDto
        {
            Container = name,
            Query = "select * from game",
        };

        var result = await _service.ExecuteQuery(request, _token);

        Assert.That(result.Success, Is.True);
    }
}
