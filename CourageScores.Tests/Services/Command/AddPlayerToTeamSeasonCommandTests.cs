using AutoFixture;
using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using Moq;
using NUnit.Framework;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddPlayerToTeamSeasonCommandTests
{
    private const string UserTeamId = "501A2E90-8F4E-4370-A77D-8B151BCF0F95";
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private Mock<AddSeasonToTeamCommand> _addSeasonToTeamCommand = null!;
    private readonly CancellationToken _token = CancellationToken.None;
    private readonly SeasonDto _season = new SeasonDtoBuilder().Build();
    private readonly DivisionDto _division = new DivisionDtoBuilder().Build();
    private EditTeamPlayerDto _player = null!;
    private CosmosTeam _team = null!;
    private AddPlayerToTeamSeasonCommand _command = null!;
    private UserDto? _user;
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private HashSet<AccessOption> _access = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create().WithCacheManagementFlags(out _cacheFlags);
        var seasonService = fixture.FreezeMock<ICachingSeasonService>();
        var commandFactory = fixture.FreezeMock<ICommandFactory>();
        _auditingHelper = fixture.FreezeMock<IAuditingHelper>();
        var userService = fixture.FreezeMock<IUserService>();
        _access = [AccessOption.ManageTeams, AccessOption.InputResults];
        var accessService = fixture.FreezeMock<IAccessService>();
        _addSeasonToTeamCommand = fixture.FreezeMockOf<AddSeasonToTeamCommand>();

        _player = new EditTeamPlayerDto();
        _team = new CosmosTeam
        {
            Id = Guid.Parse(UserTeamId),
            Name = "TEAM",
        };
        _user = new UserDto { TeamId = Guid.Parse(UserTeamId), Name = "an admin" };
        _command = fixture.Create<AddPlayerToTeamSeasonCommand>();

        userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);
        _addSeasonToTeamCommand.Setup(c => c.ForSeason(_season.Id)).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.ForDivision(_division.Id)).Returns(_addSeasonToTeamCommand.Object);
        commandFactory.Setup(f => f.GetCommand<AddSeasonToTeamCommand>()).Returns(_addSeasonToTeamCommand.Object);
        accessService
            .Setup(s => s.HasAccess(It.IsAny<UserDto?>(), It.IsAny<AccessOption>(), _token))
            .ReturnsAsync((UserDto? _, AccessOption access, CancellationToken _) => _access.Contains(access));
    }

    [Test]
    public async Task ApplyUpdate_WhenModelDeleted_ReturnsUnsuccessful()
    {
        _team.Deleted = new DateTime(2001, 02, 03);
        _player.Name = "not-empty";

        var result = await _command.ForPlayer(_player).ToDivision(_division.Id).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo([
            "Cannot edit a team that has been deleted"
        ]));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        _user = null;
        _player.Name = "not-empty";

        var result = await _command.ForPlayer(_player).ToDivision(_division.Id).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo([
            "Player cannot be added, not logged in"
        ]));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [TestCase(false, false, null)]
    [TestCase(false, true, null)]
    [TestCase(false, true, "11111111-1111-1111-1111-111111111111")]
    public async Task ApplyUpdate_WhenUserNotPermitted_ReturnsUnsuccessful(bool canManageTeams, bool canInputResults, string? userTeamId)
    {
        _access = canManageTeams ? _access.With(AccessOption.ManageTeams) : _access.Without(AccessOption.ManageTeams);
        _access = canInputResults ? _access.With(AccessOption.InputResults) : _access.Without(AccessOption.InputResults);
        _user!.TeamId = userTeamId != null ? Guid.Parse(userTeamId) : null;
        _player.Name = "not-empty";

        var result = await _command.ForPlayer(_player).ToDivision(_division.Id).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo([
            "Player cannot be added, not permitted"
        ]));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonNotFound_ReturnsUnsuccessful()
    {
        _player.Name = "not-empty";

        var result = await _command.ForPlayer(_player).ToDivision(_division.Id).ToSeason(Guid.NewGuid()).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo([
            "Season could not be found"
        ]));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonIsNotFoundAndAllowed_AddsSeasonToTeam()
    {
        var addSeasonToTeamCommandResult = new ActionResult<TeamSeason>
        {
            Success = true,
            Messages =
            {
                "Success",
            },
            Result = new TeamSeason(),
        };
        _addSeasonToTeamCommand.Setup(c => c.ApplyUpdate(_team, _token)).ReturnsAsync(addSeasonToTeamCommandResult);
        _player.Name = "not-empty";

        await _command.ForPlayer(_player).ToDivision(_division.Id).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        _addSeasonToTeamCommand.Verify(c => c.ForSeason(_season.Id));
        _addSeasonToTeamCommand.Verify(c => c.ApplyUpdate(_team, _token));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_division.Id));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonIsNotFoundAndNotAllowed_DoesNotAddSeasonToTeam()
    {
        var addSeasonToTeamCommandResult = new ActionResult<TeamSeason>
        {
            Result = new TeamSeason(),
            Messages =
            {
                "Success",
            },
            Success = true,
        };
        _addSeasonToTeamCommand.Setup(c => c.ApplyUpdate(_team, _token)).ReturnsAsync(addSeasonToTeamCommandResult);
        _player.Name = "not-empty";

        var result = await _command.ForPlayer(_player).ToDivision(_division.Id).ToSeason(_season.Id).AddSeasonToTeamIfMissing(false).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo([
            "SEASON season is not attributed to team TEAM"
        ]));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonIsNotFoundAndCannotAddSeasonToTeam_ReturnsUnsuccessful()
    {
        var addSeasonToTeamCommandResult = new ActionResult<TeamSeason>
        {
            Success = false,
            Messages =
            {
                "FAILURE",
            },
            Result = new TeamSeason(),
        };
        _addSeasonToTeamCommand.Setup(c => c.ApplyUpdate(_team, _token)).ReturnsAsync(addSeasonToTeamCommandResult);
        _player.Name = "not-empty";

        var result = await _command.ForPlayer(_player).ToDivision(_division.Id).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo([
            "Could not add the SEASON season to team TEAM"
        ]));
        Assert.That(result.Messages, Is.EqualTo([
            "FAILURE"
        ]));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenPlayerNameIsEmpty_ReturnsUnsuccessful()
    {
        _team.Seasons.Add(new TeamSeason
        {
            Id = Guid.NewGuid(),
            SeasonId = _season.Id,
            Players =
            {
                new TeamPlayer
                {
                    Name = "Captain America",
                    Deleted = null,
                },
            },
        });
        _player.Name = "  ";

        var result = await _command.ForPlayer(_player).ToDivision(_division.Id).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo([
            "Player name cannot be empty"
        ]));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonIsNotFoundAndNoResultFromAddingSeasonToTeam_ReturnsUnsuccessful()
    {
        var addSeasonToTeamCommandResult = new ActionResult<TeamSeason>
        {
            Success = true,
            Messages =
            {
                "IMPLIED SUCCESS",
            },
            Result = null,
        };
        _addSeasonToTeamCommand.Setup(c => c.ApplyUpdate(_team, _token)).ReturnsAsync(addSeasonToTeamCommandResult);
        _player.Name = "not-empty";

        var result = await _command.ForPlayer(_player).ToDivision(_division.Id).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo([
            "Could not add the SEASON season to team TEAM"
        ]));
        Assert.That(result.Messages, Is.EqualTo([
            "IMPLIED SUCCESS"
        ]));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [TestCase("Captain America")]
    [TestCase("Captain America  ")]
    [TestCase("captain america  ")]
    public async Task ApplyUpdate_WhenPlayerWithSameNameExists_ReturnsSuccessfulNoChangesMade(string requestedPlayerName)
    {
        _team.Seasons.Add(new TeamSeason
        {
            Id = Guid.NewGuid(),
            SeasonId = _season.Id,
            Players =
            {
                new TeamPlayer
                {
                    Name = "Captain America       ",
                    Deleted = null,
                },
            },
        });
        _player.Name = requestedPlayerName;

        var result = await _command.ForPlayer(_player).ToDivision(_division.Id).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo([
            "Player already exists with this name, player not added"
        ]));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenPlayerWithSameNameExistsButDeleted_UndeletesPlayer()
    {
        _team.Seasons.Add(new TeamSeason
        {
            Id = Guid.NewGuid(),
            SeasonId = _season.Id,
            Players =
            {
                new TeamPlayer
                {
                    Id = Guid.NewGuid(),
                    Name = "Captain America",
                    Deleted = new DateTime(2001, 02, 03),
                    Remover = "Someone",
                    EmailAddress = "captain@america.com",
                },
            },
        });
        _player.Name = "Captain AMERICA";
        _player.Captain = true;
        _player.EmailAddress = "the_captain@america.com";

        var result = await _command.ForPlayer(_player).ToDivision(_division.Id).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo([
            "Player undeleted from team"
        ]));
        var teamSeason = _team.Seasons.Single(ts => ts.SeasonId == _season.Id);
        var teamPlayer = teamSeason.Players.Single();
        Assert.That(teamPlayer.Name, Is.EqualTo("Captain AMERICA"));
        Assert.That(teamPlayer.Captain, Is.True);
        Assert.That(teamPlayer.EmailAddress, Is.EqualTo("the_captain@america.com"));
        _auditingHelper.Verify(h => h.SetUpdated(teamPlayer, _token));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_division.Id));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
    }

    [Test]
    public async Task ApplyUpdate_WhenPlayerNotFound_AddsPlayer()
    {
        _team.Seasons.Add(new TeamSeason
        {
            Id = Guid.NewGuid(),
            SeasonId = _season.Id,
        });
        _player.Name = "Captain America  ";
        _player.Captain = true;
        _player.EmailAddress = "the_captain@america.com";

        var result = await _command.ForPlayer(_player).ToDivision(_division.Id).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo([
            "Player added to the TEAM team for the SEASON season"
        ]));
        var teamSeason = _team.Seasons.Single(ts => ts.SeasonId == _season.Id);
        var teamPlayer = teamSeason.Players.Single();
        Assert.That(teamPlayer.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(teamPlayer.Captain, Is.True);
        Assert.That(teamPlayer.EmailAddress, Is.EqualTo("the_captain@america.com"));
        _auditingHelper.Verify(h => h.SetUpdated(teamPlayer, _token));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_division.Id));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
    }
}
