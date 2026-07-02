using AutoFixture;
using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using CourageScores.Tests.Services;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class GameTeamAdapterTests
{
    private const string UserTeamId = "BB6F3067-F2C2-464F-9136-EA6E0C1E2AD0";
    private readonly CancellationToken _token = CancellationToken.None;
    private GameTeamAdapter _adapter = null!;
    private UserDto? _user;
    private HashSet<AccessOption> _access = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _user = new UserDto { TeamId = Guid.Parse(UserTeamId) };
        _access = [];
        var userService = fixture.FreezeMock<IUserService>();
        var accessService = fixture.FreezeMock<IAccessService>();
        _adapter = fixture.Create<GameTeamAdapter>();
        userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        accessService
            .Setup(s => s.HasAccess(It.IsAny<UserDto?>(), It.IsAny<AccessOption>(), _token))
            .ReturnsAsync((UserDto? _, AccessOption access, CancellationToken _) => _access.Contains(access));
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
        _access = manageScores ? _access.With(AccessOption.ManageScores) : _access;
        _access = inputResults ? _access.With(AccessOption.InputResults) : _access;
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
        _access = manageScores ? _access.With(AccessOption.ManageScores) : _access;
        _access = inputResults ? _access.With(AccessOption.InputResults) : _access;
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
