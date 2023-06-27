using CourageScores.Filters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using CourageScores.Services.Team;
using Moq;
using NUnit.Framework;

using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class UpdatePlayerCommandTests
{
    private const string UserTeamId = "0AEBA4F0-3AB3-49A7-97AC-7318887E1F51";
    private Mock<IUserService> _userService = null!;
    private Mock<ISeasonService> _seasonService = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private Mock<IGenericRepository<CosmosGame>> _gameRepository = null!;
    private Mock<ITeamService> _teamService = null!;
    private Mock<ICommandFactory> _commandFactory = null!;
    private Mock<AddPlayerToTeamSeasonCommand> _addPlayerToSeasonCommand = null!;
    private readonly CancellationToken _token = new CancellationToken();
    private UpdatePlayerCommand _command = null!;
    private CosmosTeam _team = null!;
    private TeamSeason _teamSeason = null!;
    private TeamPlayer _teamPlayer = null!;
    private SeasonDto _season = null!;
    private EditTeamPlayerDto _update = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _seasonService = new Mock<ISeasonService>();
        _auditingHelper = new Mock<IAuditingHelper>();
        _gameRepository = new Mock<IGenericRepository<CosmosGame>>();
        _teamService = new Mock<ITeamService>();
        _commandFactory = new Mock<ICommandFactory>();
        _addPlayerToSeasonCommand = new Mock<AddPlayerToTeamSeasonCommand>(
            _seasonService.Object,
            _commandFactory.Object,
            _auditingHelper.Object,
            _userService.Object,
            new ScopedCacheManagementFlags());
        _command = new UpdatePlayerCommand(
            _userService.Object,
            _seasonService.Object,
            _auditingHelper.Object,
            _gameRepository.Object,
            _teamService.Object,
            _commandFactory.Object);

        _user = new UserDto
        {
            Name = "USER",
            Access = new AccessDto
            {
                ManageTeams = true
            },
            TeamId = Guid.Parse(UserTeamId),
        };
        _season = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Name = "SEASON",
        };
        _teamPlayer = new TeamPlayer
        {
            Id = Guid.NewGuid(),
            Name = "PLAYER",
            Updated = new DateTime(2001, 02, 03),
            Editor = "EDITOR",
        };
        _teamSeason = new TeamSeason
        {
            SeasonId = _season.Id,
            Players = { _teamPlayer }
        };
        _team = new CosmosTeam
        {
            Id = Guid.Parse(UserTeamId),
            Seasons = { _teamSeason },
            Name = "TEAM"
        };
        _update = new EditTeamPlayerDto
        {
            Name = "PLAYER (new)",
            Captain = true,
            EmailAddress = "email@address.com",
            LastUpdated = new DateTime(2001, 02, 03),
        };

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);
        _commandFactory
            .Setup(f => f.GetCommand<AddPlayerToTeamSeasonCommand>())
            .Returns(_addPlayerToSeasonCommand.Object);
        _addPlayerToSeasonCommand
            .Setup(c => c.ForPlayer(It.IsAny<EditTeamPlayerDto>()))
            .Returns(_addPlayerToSeasonCommand.Object);
        _addPlayerToSeasonCommand
            .Setup(c => c.ToSeason(It.IsAny<Guid>()))
            .Returns(_addPlayerToSeasonCommand.Object);
        _addPlayerToSeasonCommand
            .Setup(c => c.AddSeasonToTeamIfMissing(It.IsAny<bool>()))
            .Returns(_addPlayerToSeasonCommand.Object);
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamDeleted_ReturnsUnsuccessful()
    {
        _team.Deleted = new DateTime(2001, 02, 03);

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Cannot edit a team that has been deleted" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        _user = null;

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Player cannot be updated, not logged in" }));
    }

    [TestCase(false, false, null)]
    [TestCase(false, false, UserTeamId)]
    [TestCase(false, true, null)]
    [TestCase(false, true, "8937E8EB-0E3B-4541-AFC6-8025B8E4E625")]
    public async Task ApplyUpdate_WhenNotPermitted_ReturnsUnsuccessful(bool manageTeams, bool inputResults, string? userTeamId)
    {
        _user!.Access!.ManageTeams = manageTeams;
        _user!.Access!.InputResults = inputResults;
        _user!.TeamId = userTeamId != null ? Guid.Parse(userTeamId) : null;

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Player cannot be updated, not permitted" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonNotFound_ReturnsUnsuccessful()
    {
        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(Guid.NewGuid()).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Season could not be found" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamNotRegisteredToSeason_ReturnsUnsuccessful()
    {
        _team.Seasons.Clear();

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Team TEAM is not registered to the SEASON season" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenPlayerIsNotRegisteredToTeamSeason_ReturnsUnsuccessful()
    {
        var result = await _command
            .ForPlayer(Guid.NewGuid()).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Team does not have a player with this id for the SEASON season" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenLastUpdatedIsMissing_ReturnsUnsuccessful()
    {
        _gameRepository.Setup(r => r.GetSome(It.IsAny<string>(), _token))
            .Returns(TestUtilities.AsyncEnumerable<CosmosGame>());
        _update.NewTeamId = _team.Id;
        _update.LastUpdated = null;

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Unable to update TeamPlayer, data integrity token is missing" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenLastUpdatedIsDifferent_ReturnsUnsuccessful()
    {
        _gameRepository.Setup(r => r.GetSome(It.IsAny<string>(), _token))
            .Returns(TestUtilities.AsyncEnumerable<CosmosGame>());
        _update.NewTeamId = _team.Id;
        _teamPlayer.Updated = new DateTime(2002, 03, 04);

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Unable to update TeamPlayer, EDITOR updated it before you at 4 Mar 2002 00:00:00" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenPlayerNotRegisteredToTeamSeason_UpdatesPlayerDetailsAndReturnsSuccessful()
    {
        _gameRepository.Setup(r => r.GetSome(It.IsAny<string>(), _token))
            .Returns(TestUtilities.AsyncEnumerable<CosmosGame>());

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Player PLAYER (new) updated in the SEASON season, 0 game/s updated" }));
        Assert.That(_teamPlayer.Name, Is.EqualTo("PLAYER (new)"));
        Assert.That(_teamPlayer.EmailAddress, Is.EqualTo("email@address.com"));
        Assert.That(_teamPlayer.Captain, Is.True);
        _auditingHelper.Verify(h => h.SetUpdated(_teamPlayer, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenDifferentTeamIdProvidedAndPlayerCouldNotBeAdded_ReturnsUnsuccessful()
    {
        _gameRepository.Setup(r => r.GetSome(It.IsAny<string>(), _token))
            .Returns(TestUtilities.AsyncEnumerable<CosmosGame>());
        var otherTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "OTHER TEAM",
        };
        _update.NewTeamId = otherTeam.Id;
        _teamService
            .Setup(s => s.Upsert(otherTeam.Id, _addPlayerToSeasonCommand.Object, _token))
            .ReturnsAsync(() => new ActionResultDto<TeamDto>
            {
                Success = false,
                Errors = { "Some error" }
            });

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Some error", "Could not move the player to other team" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenDifferentTeamIdProvided_UpdatesPlayerTeam()
    {
        _gameRepository.Setup(r => r.GetSome(It.IsAny<string>(), _token))
            .Returns(TestUtilities.AsyncEnumerable<CosmosGame>());
        var otherTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "OTHER TEAM",
        };
        _update.NewTeamId = otherTeam.Id;
        _teamService
            .Setup(s => s.Upsert(otherTeam.Id, _addPlayerToSeasonCommand.Object, _token))
            .ReturnsAsync(() => new ActionResultDto<TeamDto>
            {
                Success = true,
                Messages = { "Player added to the OTHER TEAM team for the SEASON season" }
            });

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Player added to the OTHER TEAM team for the SEASON season" }));

    _auditingHelper.Verify(h => h.SetDeleted(_teamPlayer, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenSameTeamIdProvided_ReturnsSuccessful()
    {
        _gameRepository.Setup(r => r.GetSome(It.IsAny<string>(), _token))
            .Returns(TestUtilities.AsyncEnumerable<CosmosGame>());
        _update.NewTeamId = _team.Id;

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Player PLAYER (new) updated in the SEASON season, 0 game/s updated" }));
        _auditingHelper.Verify(h => h.SetUpdated(_teamPlayer, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenDifferentTeamIdProvidedAndPlayerPlayingInGames_ReturnsUnsuccessful()
    {
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            Matches =
            {
                new GameMatch
                {
                    AwayPlayers = { new GamePlayer { Id = _teamPlayer.Id } },
                    HomePlayers = { new GamePlayer { Id = _teamPlayer.Id } },
                }
            }
        };
        _gameRepository.Setup(r => r.GetSome($"t.seasonId = '{_season.Id}'", _token))
            .Returns(TestUtilities.AsyncEnumerable(game));
        _update.NewTeamId = Guid.NewGuid();

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Cannot move a player once they've played in some games" }));
    }

    [Test]
    public async Task ApplyUpdate_WhenUpdatingPlayerInAGame_UpdatesPlayerDetailsInGivenGame()
    {
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            Matches =
            {
                new GameMatch
                {
                    AwayPlayers = { new GamePlayer { Id = _teamPlayer.Id } },
                    HomePlayers = { new GamePlayer { Id = _teamPlayer.Id } },
                }
            }
        };
        _update.GameId = game.Id;
        _gameRepository.Setup(r => r.GetSome($"t.id = '{game.Id}' and t.seasonId = '{_season.Id}'", _token))
            .Returns(TestUtilities.AsyncEnumerable(game));

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Player PLAYER (new) updated in the SEASON season, 1 game/s updated" }));
        Assert.That(game.Matches[0].AwayPlayers[0].Name, Is.EqualTo("PLAYER (new)"));
        Assert.That(game.Matches[0].HomePlayers[0].Name, Is.EqualTo("PLAYER (new)"));
        _gameRepository.Verify(r => r.GetSome($"t.id = '{game.Id}' and t.seasonId = '{_season.Id}'", _token));
        _gameRepository.Verify(r => r.Upsert(game, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenUpdatingPlayerInAllGames_UpdatesPlayerDetailsInGivenGame()
    {
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            Matches =
            {
                new GameMatch
                {
                    AwayPlayers = { new GamePlayer { Id = _teamPlayer.Id } },
                    HomePlayers = { new GamePlayer { Id = _teamPlayer.Id } },
                }
            }
        };
        _gameRepository.Setup(r => r.GetSome($"t.seasonId = '{_season.Id}'", _token))
            .Returns(TestUtilities.AsyncEnumerable(game));

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Player PLAYER (new) updated in the SEASON season, 1 game/s updated" }));
        Assert.That(game.Matches[0].AwayPlayers[0].Name, Is.EqualTo("PLAYER (new)"));
        Assert.That(game.Matches[0].HomePlayers[0].Name, Is.EqualTo("PLAYER (new)"));
        _gameRepository.Verify(r => r.GetSome($"t.seasonId = '{_season.Id}'", _token));
        _gameRepository.Verify(r => r.Upsert(game, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenPlayerNotFoundInAGame_ReturnsSuccessful()
    {
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            Matches =
            {
                new GameMatch
                {
                    AwayPlayers = { new GamePlayer { Id = Guid.NewGuid() } },
                    HomePlayers = { new GamePlayer { Id = Guid.NewGuid() } },
                }
            }
        };
        _update.GameId = game.Id;
        _gameRepository.Setup(r => r.GetSome(It.IsAny<string>(), _token))
            .Returns(TestUtilities.AsyncEnumerable(game));

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        _gameRepository.Verify(r => r.Upsert(game, _token), Times.Never);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Player PLAYER (new) updated in the SEASON season, 0 game/s updated" }));
    }
}