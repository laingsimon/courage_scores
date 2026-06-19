using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using Moq;
using NUnit.Framework;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class RemovePlayerCommandTests
{
    private static readonly TeamPlayer TeamPlayer = new TeamPlayer
    {
        Id = Guid.NewGuid(),
        Name = "PLAYER",
    };

    private const string UserTeamId = "25BF0C9C-C4C8-4975-BC0F-DAB07030C453";
    private Mock<ICachingSeasonService> _seasonService = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private readonly CancellationToken _token = new();
    private readonly SeasonDto _season = new SeasonDtoBuilder().Build();
    private CosmosTeam _team = null!;
    private UserDto? _user;
    private RemovePlayerCommand _command = null!;
    private TeamSeason _teamSeason = null!;
    private Mock<IAccessService> _accessService = null!;
    private HashSet<AccessOption> _access = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _seasonService = new Mock<ICachingSeasonService>();
        _userService = new Mock<IUserService>();
        _access = [AccessOption.ManageTeams];
        _accessService = new Mock<IAccessService>();
        _auditingHelper = new Mock<IAuditingHelper>();
        _user = new UserDto { TeamId = Guid.Parse(UserTeamId) };
        _teamSeason = new TeamSeason
        {
            SeasonId = _season.Id,
            Players = { TeamPlayer },
        };
        _team = new CosmosTeam
        {
            Id = Guid.Parse(UserTeamId),
            Seasons = { _teamSeason },
            Name = "TEAM",
        };
        _command = new RemovePlayerCommand(_seasonService.Object, _userService.Object, _auditingHelper.Object, _accessService.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);
        _accessService
            .Setup(s => s.HasAccess(It.IsAny<UserDto?>(), It.IsAny<AccessOption>(), _token))
            .ReturnsAsync((UserDto? _, AccessOption access, CancellationToken _) => _access.Contains(access));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamDeleted_ReturnsUnsuccessful()
    {
        _team.Deleted = new DateTime(2001, 02, 03);

        var result = await _command.ForPlayer(TeamPlayer.Id).FromSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Cannot edit a team that has been deleted" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        _user = null;

        var result = await _command.ForPlayer(TeamPlayer.Id).FromSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Player cannot be removed, not logged in" }));
    }

    [TestCase(false, false, null)]
    [TestCase(false, false, UserTeamId)]
    [TestCase(false, true, null)]
    [TestCase(false, true, "8937E8EB-0E3B-4541-AFC6-8025B8E4E625")]
    public async Task ApplyUpdate_WhenNotPermitted_ReturnsUnsuccessful(bool manageTeams, bool inputResults, string? teamId)
    {
        _access = manageTeams ? _access.With(AccessOption.ManageTeams) : _access.Without(AccessOption.ManageTeams);
        _access = inputResults ? _access.With(AccessOption.InputResults) : _access.Without(AccessOption.InputResults);
        _user!.TeamId = teamId != null ? Guid.Parse(teamId) : null;

        var result = await _command.ForPlayer(TeamPlayer.Id).FromSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Player cannot be removed, not permitted" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonNotFound_ReturnsUnsuccessful()
    {
        var result = await _command.ForPlayer(TeamPlayer.Id).FromSeason(Guid.NewGuid()).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Season could not be found" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonDeleted_ReturnsUnsuccessful()
    {
        _teamSeason.Deleted = new DateTime(2001, 02, 03);

        var result = await _command.ForPlayer(TeamPlayer.Id).FromSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Team is not registered to the SEASON season" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamNotRegisteredToSeason_ReturnsUnsuccessful()
    {
        _team.Seasons.Clear();

        var result = await _command.ForPlayer(TeamPlayer.Id).FromSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Team is not registered to the SEASON season" }));
    }

    [Test]
    public async Task? ApplyUpdate_WhenPlayerIsNotRegisteredToTeamSeason_ReturnsUnsuccessful()
    {
        var result = await _command.ForPlayer(Guid.NewGuid()).FromSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Player does not have a player with this id for the SEASON season" }));
    }

    [Test]
    public async Task? ApplyUpdate_WhenPlayerIsAlreadyDeleted_ReturnsSuccessful()
    {
        var deletedPlayer = new TeamPlayer
        {
            Id = Guid.NewGuid(),
            Name = "PLAYER",
            Deleted = new DateTime(2001, 02, 03),
        };
        _teamSeason.Players.Clear();
        _teamSeason.Players.Add(deletedPlayer);

        var result = await _command.ForPlayer(deletedPlayer.Id).FromSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Player PLAYER removed from the SEASON season" }));
    }

    [Test]
    public async Task? ApplyUpdate_WhenPlayerIsRegisteredToTeamSeason_DeletesPlayerAndReturnsSuccessful()
    {
        var result = await _command.ForPlayer(TeamPlayer.Id).FromSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Player PLAYER removed from the SEASON season" }));
        _auditingHelper.Verify(h => h.SetDeleted(TeamPlayer, _token));
    }
}
