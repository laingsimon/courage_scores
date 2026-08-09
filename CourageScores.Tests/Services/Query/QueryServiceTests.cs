using System.Net;
using AutoFixture;
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
    private Mock<Database> _database = null!;
    private UserDto? _user;
    private TableDto[] _tables = null!;
    private HashSet<AccessOption> _access = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _user = null;
        _access = [AccessOption.RunDataQueries];
        var accessService = fixture.FreezeMock<IAccessService>();
        var userService = fixture.FreezeMock<IUserService>();
        _database = new Mock<Database> { DefaultValue = DefaultValue.Mock };
        fixture.Register(() => _database);
        var cosmosTableService = fixture.FreezeMock<ICosmosTableService>();
        _service = fixture.Create<QueryService>();
        _user = new UserDto();
        _tables = [new TableDto { Name = "game" }];

        _database
            .Setup(d => d.CreateContainerIfNotExistsAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, _token))
            .ReturnsAsync(() => null);
        userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        cosmosTableService
            .Setup(s => s.GetTables(_token))
            .Returns(() => TestUtilities.AsyncEnumerable(_tables));
        accessService
            .Setup(s => s.HasAccess(It.IsAny<UserDto?>(), It.IsAny<AccessOption>(), It.IsAny<UserAccessContext>(), _token))
            .ReturnsAsync((UserDto? _, AccessOption access, UserAccessContext _, CancellationToken _) => _user != null && _access.Contains(access));
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
        _access = _access.Without(AccessOption.RunDataQueries);

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

    [Test]
    public async Task ExecuteQuery_WhenErrorThrown_ReturnsDetails()
    {
        var request = new QueryRequestDto
        {
            Container = "game",
            Query = "select * from game",
        };
        _database
            .Setup(d => d.GetContainer(It.IsAny<string>()))
            .Throws(new CosmosException("some error", HttpStatusCode.BadRequest, 0, "", 0));

        var result = await _service.ExecuteQuery(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(["some error"]));
    }
}
