using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using Moq;
using NUnit.Framework;

using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class UpdatePlayerCommandTests
{
    private const string UserTeamId = "0AEBA4F0-3AB3-49A7-97AC-7318887E1F51";
    private Mock<IUserService> _userService = null!;
    private Mock<ISeasonService> _seasonService = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private Mock<IGenericRepository<Game>> _gameRepository = null!;
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
        _gameRepository = new Mock<IGenericRepository<Game>>();
        _command = new UpdatePlayerCommand(_userService.Object, _seasonService.Object, _auditingHelper.Object, _gameRepository.Object);

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
        };

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamDeleted_ReturnsUnsuccessful()
    {
        _team.Deleted = new DateTime(2001, 02, 03);

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Cannot edit a team that has been deleted"));
    }

    [Test]
    public async Task ApplyUpdate_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        _user = null;

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Player cannot be updated, not logged in"));
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
        Assert.That(result.Message, Is.EqualTo("Player cannot be updated, not permitted"));
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonNotFound_ReturnsUnsuccessful()
    {
        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(Guid.NewGuid()).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Season could not be found"));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamNotRegisteredToSeason_ReturnsUnsuccessful()
    {
        _team.Seasons.Clear();

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Team TEAM is not registered to the SEASON season"));
    }

    [Test]
    public async Task ApplyUpdate_WhenPlayerIsNotRegisteredToTeamSeason_ReturnsUnsuccessful()
    {
        var result = await _command
            .ForPlayer(Guid.NewGuid()).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Team does not have a player with this id for the SEASON season"));
    }

    [Test]
    public async Task ApplyUpdate_WhenPlayerNotRegisteredToTeamSeason_UpdatesPlayerDetailsAndReturnsSuccessful()
    {
        _gameRepository.Setup(r => r.GetSome(It.IsAny<string>(), _token))
            .Returns(TestUtilities.AsyncEnumerable<Game>());

        var result = await _command
            .ForPlayer(_teamPlayer.Id).InSeason(_season.Id).WithData(_update)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Player PLAYER (new) updated in the SEASON season, 0 game/s updated"));
        Assert.That(_teamPlayer.Name, Is.EqualTo("PLAYER (new)"));
        Assert.That(_teamPlayer.EmailAddress, Is.EqualTo("email@address.com"));
        Assert.That(_teamPlayer.Captain, Is.True);
        _auditingHelper.Verify(h => h.SetUpdated(_teamPlayer, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenUpdatingPlayerInAGame_UpdatesPlayerDetailsInGivenGame()
    {
        var game = new Game
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
        Assert.That(result.Message, Is.EqualTo("Player PLAYER (new) updated in the SEASON season, 1 game/s updated"));
        Assert.That(game.Matches[0].AwayPlayers[0].Name, Is.EqualTo("PLAYER (new)"));
        Assert.That(game.Matches[0].HomePlayers[0].Name, Is.EqualTo("PLAYER (new)"));
        _gameRepository.Verify(r => r.GetSome($"t.id = '{game.Id}' and t.seasonId = '{_season.Id}'", _token));
        _gameRepository.Verify(r => r.Upsert(game, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenUpdatingPlayerInAllGames_UpdatesPlayerDetailsInGivenGame()
    {
        var game = new Game
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
        Assert.That(result.Message, Is.EqualTo("Player PLAYER (new) updated in the SEASON season, 1 game/s updated"));
        Assert.That(game.Matches[0].AwayPlayers[0].Name, Is.EqualTo("PLAYER (new)"));
        Assert.That(game.Matches[0].HomePlayers[0].Name, Is.EqualTo("PLAYER (new)"));
        _gameRepository.Verify(r => r.GetSome($"t.seasonId = '{_season.Id}'", _token));
        _gameRepository.Verify(r => r.Upsert(game, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenPlayerNotFoundInAGame_UpdatesPlayerDetailsInGivenGame()
    {
        var game = new Game
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
        Assert.That(result.Message, Is.EqualTo("Player PLAYER (new) updated in the SEASON season, 0 game/s updated"));
    }
}