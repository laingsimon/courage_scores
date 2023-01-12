using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddPlayerToTeamSeasonCommandTests
{
    private const string UserTeamId = "501A2E90-8F4E-4370-A77D-8B151BCF0F95";
    private Mock<ISeasonService> _seasonService = null!;
    private Mock<ICommandFactory> _commandFactory = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<AddSeasonToTeamCommand> _addSeasonToTeamCommand = null!;
    private readonly CancellationToken _token = new CancellationToken();
    private readonly SeasonDto _season = new SeasonDto
    {
        Id = Guid.NewGuid(),
        Name = "SEASON",
    };
    private EditTeamPlayerDto _player = null!;
    private Team _team = null!;
    private AddPlayerToTeamSeasonCommand _command = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _seasonService = new Mock<ISeasonService>();
        _commandFactory = new Mock<ICommandFactory>();
        _auditingHelper = new Mock<IAuditingHelper>();
        _userService = new Mock<IUserService>();
        _addSeasonToTeamCommand = new Mock<AddSeasonToTeamCommand>(_auditingHelper.Object, _seasonService.Object);

        _player = new EditTeamPlayerDto();
        _team = new Team
        {
            Id = Guid.Parse(UserTeamId),
            Name = "TEAM",
        };
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageTeams = true,
                InputResults = true,
            },
            TeamId = Guid.Parse(UserTeamId),
            Name = "an admin",
        };
        _command = new AddPlayerToTeamSeasonCommand(_seasonService.Object, _commandFactory.Object, _auditingHelper.Object, _userService.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);
        _addSeasonToTeamCommand.Setup(c => c.ForSeason(_season.Id)).Returns(_addSeasonToTeamCommand.Object);
        _commandFactory.Setup(f => f.GetCommand<AddSeasonToTeamCommand>()).Returns(_addSeasonToTeamCommand.Object);
    }

    [Test]
    public async Task ApplyUpdate_WhenModelDeleted_ReturnsUnsuccessful()
    {
        _team.Deleted = new DateTime(2001, 02, 03);

        var result = await _command.ForPlayer(_player).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Cannot edit a team that has been deleted"));
    }

    [Test]
    public async Task ApplyUpdate_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        _user = null;

        var result = await _command.ForPlayer(_player).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Player cannot be added, not logged in"));
    }

    [TestCase(false, false, null)]
    [TestCase(false, true, null)]
    [TestCase(false, true, "11111111-1111-1111-1111-111111111111")]
    public async Task ApplyUpdate_WhenUserNotPermitted_ReturnsUnsuccessful(bool canManageTeams, bool canInputResults, string? userTeamId)
    {
        _user!.Access!.ManageTeams = canManageTeams;
        _user!.Access!.InputResults = canInputResults;
        _user!.TeamId = userTeamId != null ? Guid.Parse(userTeamId) : null;

        var result = await _command.ForPlayer(_player).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Player cannot be added, not permitted"));
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonNotFound_ReturnsUnsuccessful()
    {
        var result = await _command.ForPlayer(_player).ToSeason(Guid.NewGuid()).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Season could not be found"));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonIsNotFound_AddsSeasonToTeam()
    {
        var addSeasonToTeamCommandResult = new CommandOutcome<TeamSeason>(true, "Success", new TeamSeason());
        _addSeasonToTeamCommand.Setup(c => c.ApplyUpdate(_team, _token)).ReturnsAsync(addSeasonToTeamCommandResult);

        await _command.ForPlayer(_player).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        _addSeasonToTeamCommand.Verify(c => c.ForSeason(_season.Id));
        _addSeasonToTeamCommand.Verify(c => c.ApplyUpdate(_team, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonIsNotFoundAndCannotAddSeasonToTeam_ReturnsUnsuccessful()
    {
        var addSeasonToTeamCommandResult = new CommandOutcome<TeamSeason>(false, "FAILURE", new TeamSeason());
        _addSeasonToTeamCommand.Setup(c => c.ApplyUpdate(_team, _token)).ReturnsAsync(addSeasonToTeamCommandResult);

        var result = await _command.ForPlayer(_player).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Could not add the SEASON season to team TEAM - FAILURE"));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonIsNotFoundAndNoResultFromAddingSeasonToTeam_ReturnsUnsuccessful()
    {
        var addSeasonToTeamCommandResult = new CommandOutcome<TeamSeason>(true, "IMPLIED SUCCESS", null);
        _addSeasonToTeamCommand.Setup(c => c.ApplyUpdate(_team, _token)).ReturnsAsync(addSeasonToTeamCommandResult);

        var result = await _command.ForPlayer(_player).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Could not add the SEASON season to team TEAM - IMPLIED SUCCESS"));
    }

    [Test]
    public async Task ApplyUpdate_WhenPlayerWithSameNameExists_ReturnsSuccessfulNoChangesMade()
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
                    Deleted = null
                }
            }
        });
        _player.Name = "Captain America";

        var result = await _command.ForPlayer(_player).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Player already exists with this name, player not added"));
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
                }
            }
        });
        _player.Name = "Captain America";
        _player.Captain = true;
        _player.EmailAddress = "the_captain@america.com";

        var result = await _command.ForPlayer(_player).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Player undeleted from team"));
        var teamSeason = _team.Seasons.Single(ts => ts.SeasonId == _season.Id);
        var teamPlayer = teamSeason.Players.Single();
        Assert.That(teamPlayer.Captain, Is.True);
        Assert.That(teamPlayer.EmailAddress, Is.EqualTo("the_captain@america.com"));
        _auditingHelper.Verify(h => h.SetUpdated(teamPlayer, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenPlayerNotFound_AddsPlayer()
    {
        _team.Seasons.Add(new TeamSeason
        {
            Id = Guid.NewGuid(),
            SeasonId = _season.Id,
        });
        _player.Name = "Captain America";
        _player.Captain = true;
        _player.EmailAddress = "the_captain@america.com";

        var result = await _command.ForPlayer(_player).ToSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Player added to the TEAM team for the SEASON season"));
        var teamSeason = _team.Seasons.Single(ts => ts.SeasonId == _season.Id);
        var teamPlayer = teamSeason.Players.Single();
        Assert.That(teamPlayer.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(teamPlayer.Captain, Is.True);
        Assert.That(teamPlayer.EmailAddress, Is.EqualTo("the_captain@america.com"));
        _auditingHelper.Verify(h => h.SetUpdated(teamPlayer, _token));
    }
}