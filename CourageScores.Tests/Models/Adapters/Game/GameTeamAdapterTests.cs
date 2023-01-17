using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class GameTeamAdapterTests
{
    private const string UserTeamId = "BB6F3067-F2C2-464F-9136-EA6E0C1E2AD0";
    private readonly CancellationToken _token = new CancellationToken();
    private GameTeamAdapter _adapter = null!;
    private Mock<IUserService> _userService = null!;
    private UserDto? _user = new UserDto
    {
        TeamId = Guid.Parse(UserTeamId),
        Access = new AccessDto(),
    };

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _adapter = new GameTeamAdapter(_userService.Object);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
    }

    [Test]
    public async Task Adapt_GivenModelAndLoggedOut_SetsPropertiesCorrectly()
    {
        _user = null;
        var model = new GameTeam
        {
            Id = Guid.NewGuid(),
            Name = "team",
            ManOfTheMatch = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.ManOfTheMatch, Is.EqualTo(Guid.Empty));
    }

    [Test]
    public async Task Adapt_GivenModelAndLoggedOutAndNoManOfTheMatch_ReturnsNullManOfTheMatch()
    {
        _user = null;
        var model = new GameTeam();

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.ManOfTheMatch, Is.Null);
    }

    [TestCase(false, false, null)]
    [TestCase(false, true, "8333B9FA-0C8C-4902-9F07-E697B147333B")]
    [TestCase(false, false, UserTeamId)]
    public async Task Adapt_GivenModelAndLoggedInAndNotPermitted_DoesNotReturnManOfTheMatch(bool manageScores, bool inputResults, string? teamId)
    {
        _user!.Access!.ManageScores = manageScores;
        _user!.Access!.InputResults = inputResults;
        var model = new GameTeam
        {
            Id = teamId != null ? Guid.Parse(teamId) : Guid.Empty,
            Name = "team",
            ManOfTheMatch = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.ManOfTheMatch, Is.EqualTo(Guid.Empty));
    }

    [TestCase(true, false, null)]
    [TestCase(false, true, UserTeamId)]
    [TestCase(true, false, UserTeamId)]
    [TestCase(true, false, "8333B9FA-0C8C-4902-9F07-E697B147333B")]
    public async Task Adapt_GivenModelAndLoggedInAndPermitted_ReturnsManOfTheMatch(bool manageScores, bool inputResults, string? teamId)
    {
        _user!.Access!.ManageScores = manageScores;
        _user!.Access!.InputResults = inputResults;
        var model = new GameTeam
        {
            Id = teamId != null ? Guid.Parse(teamId) : Guid.Empty,
            Name = "team",
            ManOfTheMatch = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.ManOfTheMatch, Is.EqualTo(model.ManOfTheMatch));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new GameTeamDto
        {
            Id = Guid.Parse(UserTeamId),
            Name = "team",
            ManOfTheMatch = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.ManOfTheMatch, Is.EqualTo(dto.ManOfTheMatch));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsTrailingWhitespace()
    {
        var dto = new GameTeamDto
        {
            Name = "team  ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("team"));
    }
}