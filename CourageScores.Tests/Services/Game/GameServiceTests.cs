using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Game;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Game;

[TestFixture]
public class GameServiceTests
{
    private static readonly GameDto EditedSubmission = new GameDto
    {
        Author = "AUTHOR",
        Editor = "EDITOR",
        Created = new DateTime(2001, 02, 03),
        Updated = new DateTime(2002, 03, 04),
    };
    private static readonly Guid SeasonId = Guid.NewGuid();

    private readonly CancellationToken _token = new();
    private GameDto? _game;
    private Mock<IUserService> _userService = null!;
    private Mock<IGenericDataService<CosmosGame, GameDto>> _underlyingService = null!;
    private UserDto? _user;
    private GameService _service = null!;
    private Mock<IPermanentDeleteRepository<CosmosGame>> _deletableRepository = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _underlyingService = new Mock<IGenericDataService<CosmosGame, GameDto>>();
        _deletableRepository = new Mock<IPermanentDeleteRepository<CosmosGame>>();
        _service = new GameService(_underlyingService.Object, _userService.Object, _deletableRepository.Object);
        _game = new GameDto
        {
            Id = Guid.NewGuid(),
            Home = new GameTeamDto
            {
                Id = Guid.NewGuid(),
                Name = "home",
            },
            Away = new GameTeamDto
            {
                Id = Guid.NewGuid(),
                Name = "away",
            },
            Address = "address",
            Date = new DateTime(2001, 02, 03),
            Postponed = true,
            DivisionId = Guid.NewGuid(),
            SeasonId = SeasonId,
            IsKnockout = true,
            Author = "GAME AUTHOR",
            Editor = "GAME EDITOR",
            Created = new DateTime(2005, 02, 03),
            Updated = new DateTime(2006, 02, 03),
            HomeSubmission = new GameDto(),
            AwaySubmission = new GameDto(),
        };
        _user = _user.SetAccess(manageScores: false);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _underlyingService.Setup(s => s.Get(It.IsAny<Guid>(), _token)).ReturnsAsync(() => _game);
        _underlyingService.Setup(s => s.GetAll(_token)).Returns(() => TestUtilities.AsyncEnumerable(_game));
        _underlyingService.Setup(s => s.GetWhere(It.IsAny<string>(), _token)).Returns(() => TestUtilities.AsyncEnumerable(_game));
    }

    [Test]
    public async Task Get_WhenGameNotFound_ShouldReturnNull()
    {
        _game = null;

        var result = await _service.Get(Guid.NewGuid(), _token);

        _underlyingService.Verify(s => s.Get(It.IsAny<Guid>(), _token));
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Get_WhenLoggedInAsAnAdmin_ShouldReturnGame()
    {
        _user.SetAccess(manageScores: true);

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result, Is.SameAs(_game));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task Get_WhenNotPermitted_ShouldExcludeSubmissions(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _user.SetAccess(inputResults: inputResults);

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result!.HomeSubmission, Is.Null);
        Assert.That(result.AwaySubmission, Is.Null);
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task Get_WhenResultsPublished_ShouldReturnGame(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _user.SetAccess(inputResults: inputResults);
        _game!.ResultsPublished = true;

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result, Is.SameAs(_game));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task Get_WhenResultsUnpublishedAndNotPermitted_ShouldReturnGame(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _user.SetAccess(inputResults: inputResults);

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result, Is.SameAs(_game));
    }

    [Test]
    public async Task Get_WhenResultsUnpublishedUserCanInputResultsForHomeTeam_ShouldReturnHomeTeamSubmission()
    {
        _game!.HomeSubmission = new GameDto
        {
            Author = "AUTHOR",
            Editor = "EDITOR",
            Created = new DateTime(2001, 02, 03),
            Updated = new DateTime(2002, 03, 04),
            Home = new GameTeamDto
            {
                ManOfTheMatch = Guid.NewGuid(),
            },
        };
        _user.SetAccess(inputResults: true, teamId: _game!.Home.Id);

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result!.Matches, Is.SameAs(_game.HomeSubmission.Matches));
        Assert.That(result.Home, Is.SameAs(_game.HomeSubmission.Home));
        result.AssertSubmissionHasGameProperties(_game);
        result.AssertHasAuditProperties(_game.HomeSubmission);
    }

    [Test]
    public async Task Get_WhenResultsUnpublishedUserCanInputResultsForHomeTeamAndNoHomeSubmissionAuditProperties_ShouldReturnAuditPropertiesFromGame()
    {
        _user.SetAccess(inputResults: true, teamId: _game!.Home.Id);

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result!.Matches, Is.SameAs(_game!.HomeSubmission!.Matches));
        result.AssertSubmissionHasGameProperties(_game);
        result.AssertHasAuditProperties(_game);
    }

    [Test]
    public async Task Get_WhenResultsUnpublishedUserCanInputResultsForHomeTeamAndNoHomeSubmission_ShouldCreateSubmission()
    {
        _game!.HomeSubmission = null;
        _user.SetAccess(inputResults: true, teamId: _game!.Home.Id);

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result, Is.Not.SameAs(_game));
        Assert.That(result!.Home, Is.SameAs(_game.Home));
        result.AssertSubmissionHasGameProperties(_game);
        result.AssertHasAuditProperties(_game);
    }

    [Test]
    public async Task Get_WhenResultsUnpublishedUserCanInputResultsForAwayTeam_ShouldReturnAwayTeamSubmission()
    {
        _game!.AwaySubmission = new GameDto
        {
            Author = "AUTHOR",
            Editor = "EDITOR",
            Created = new DateTime(2001, 02, 03),
            Updated = new DateTime(2002, 03, 04),
            Away = new GameTeamDto
            {
                ManOfTheMatch = Guid.NewGuid(),
            },
        };
        _user.SetAccess(inputResults: true, teamId: _game!.Away.Id);

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result!.Matches, Is.SameAs(_game.AwaySubmission.Matches));
        Assert.That(result.Away, Is.SameAs(_game.AwaySubmission.Away));
        result.AssertSubmissionHasGameProperties(_game);
        result.AssertHasAuditProperties(_game.AwaySubmission);
    }

    [Test]
    public async Task Get_WhenResultsUnpublishedUserCanInputResultsForAwayTeamAndNoAwaySubmission_ShouldCreateSubmission()
    {
        _game!.AwaySubmission = null;
        _user.SetAccess(inputResults: true, teamId: _game!.Away.Id);

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result, Is.Not.SameAs(_game));
        Assert.That(result!.Away, Is.SameAs(_game.Away));
        result.AssertSubmissionHasGameProperties(_game);
        result.AssertHasAuditProperties(_game);
    }

    [Test]
    public async Task Get_WhenResultsUnpublishedUserCanInputResultsForAwayTeamAndNoAwaySubmissionAuditProperties_ShouldReturnAuditPropertiesFromGame()
    {
        _user.SetAccess(inputResults: true, teamId: _game!.Away.Id);

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result!.Matches, Is.SameAs(_game!.AwaySubmission!.Matches));
        result.AssertSubmissionHasGameProperties(_game);
        result.AssertHasAuditProperties(_game);
    }

    [Test]
    public async Task GetAll_WhenLoggedInAsAnAdmin_ShouldReturnGame()
    {
        _user.SetAccess(manageScores: true);

        var games = await _service.GetAll(_token).ToList();

        _underlyingService.Verify(s => s.GetAll(_token));
        Assert.That(games.Single(), Is.SameAs(_game));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task GetAll_WhenNotPermitted_ShouldExcludeSubmissions(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _user.SetAccess(inputResults: inputResults);

        var games = await _service.GetAll(_token).ToList();

        Assert.That(games.Single().HomeSubmission, Is.Null);
        Assert.That(games.Single().AwaySubmission, Is.Null);
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task GetAll_WhenResultsPublished_ShouldReturnGame(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _user.SetAccess(inputResults: inputResults);
        _game!.ResultsPublished = true;

        var games = await _service.GetAll(_token).ToList();

        Assert.That(games.Single(), Is.SameAs(_game));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task GetAll_WhenResultsUnpublishedAndNotPermitted_ShouldReturnGame(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _user.SetAccess(inputResults: inputResults);

        var games = await _service.GetAll(_token).ToList();

        Assert.That(games.Single(), Is.SameAs(_game));
    }

    [Test]
    public async Task GetAll_WhenResultsUnpublishedUserCanInputResultsForHomeTeam_ShouldReturnHomeTeamSubmission()
    {
        _game!.HomeSubmission = EditedSubmission;
        _user.SetAccess(inputResults: true, teamId: _game.Home.Id);

        var games = await _service.GetAll(_token).ToList();

        Assert.That(games.Single().Matches, Is.SameAs(_game.HomeSubmission.Matches));
        games.Single().AssertSubmissionHasGameProperties(_game);
        games.Single().AssertHasAuditProperties(_game.HomeSubmission);
    }

    [Test]
    public async Task GetAll_WhenResultsUnpublishedUserCanInputResultsForAwayTeam_ShouldReturnAwayTeamSubmission()
    {
        _game!.AwaySubmission = EditedSubmission;
        _user.SetAccess(inputResults: true, teamId: _game.Away.Id);

        var games = await _service.GetAll(_token).ToList();

        Assert.That(games.Single().Matches, Is.SameAs(_game.AwaySubmission.Matches));
        games.Single().AssertSubmissionHasGameProperties(_game);
        games.Single().AssertHasAuditProperties(_game.AwaySubmission);
    }

    [Test]
    public async Task GetWhere_WhenLoggedInAsAnAdmin_ShouldReturnGame()
    {
        _user.SetAccess(manageScores: true);

        var games = await _service.GetWhere("query", _token).ToList();

        _underlyingService.Verify(s => s.GetWhere("query", _token));
        Assert.That(games.Single(), Is.SameAs(_game));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task GetWhere_WhenNotPermitted_ShouldExcludeSubmissions(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _user.SetAccess(inputResults: inputResults);

        var games = await _service.GetWhere("query", _token).ToList();

        Assert.That(games.Single().HomeSubmission, Is.Null);
        Assert.That(games.Single().AwaySubmission, Is.Null);
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task GetWhere_WhenResultsPublished_ShouldReturnGame(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _user.SetAccess(inputResults: inputResults);
        _game!.ResultsPublished = true;

        var games = await _service.GetWhere("query", _token).ToList();

        Assert.That(games.Single(), Is.SameAs(_game));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task GetWhere_WhenResultsUnpublishedAndNotPermitted_ShouldReturnGame(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _user.SetAccess(inputResults: inputResults);

        var games = await _service.GetWhere("query", _token).ToList();

        Assert.That(games.Single(), Is.SameAs(_game));
    }

    [Test]
    public async Task GetWhere_WhenResultsUnpublishedUserCanInputResultsForHomeTeam_ShouldReturnHomeTeamSubmission()
    {
        _game!.HomeSubmission = EditedSubmission;
        _user.SetAccess(inputResults: true, teamId: _game.Home.Id);

        var games = await _service.GetWhere("query", _token).ToList();

        Assert.That(games.Single().Matches, Is.SameAs(_game.HomeSubmission.Matches));
        games.Single().AssertSubmissionHasGameProperties(_game);
        games.Single().AssertHasAuditProperties(_game.HomeSubmission);
    }

    [Test]
    public async Task GetWhere_WhenResultsUnpublishedUserCanInputResultsForAwayTeam_ShouldReturnAwayTeamSubmission()
    {
        _game!.AwaySubmission = EditedSubmission;
        _user.SetAccess(inputResults: true, teamId: _game.Away.Id);


        var games = await _service.GetWhere("query", _token).ToList();

        Assert.That(games.Single().Matches, Is.SameAs(_game.AwaySubmission.Matches));
        games.Single().AssertSubmissionHasGameProperties(_game.AwaySubmission);
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task Delete_WhenNotPermitted_ExcludesSubmissionsFromResult(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _user.SetAccess(inputResults: inputResults);
        _underlyingService.Setup(s => s.Delete(_game!.Id, _token)).ReturnsAsync(() => new ActionResultDto<GameDto>
        {
            Result = _game,
            Success = true,
        });

        var game = await _service.Delete(_game!.Id, _token);

        _underlyingService.Verify(s => s.Delete(_game.Id, _token));
        Assert.That(game.Result!.HomeSubmission, Is.Null);
        Assert.That(game.Result!.AwaySubmission, Is.Null);
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task Delete_WhenNotPermitted_ReturnsNull(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _user.SetAccess(inputResults: inputResults);
        _underlyingService.Setup(s => s.Delete(_game!.Id, _token)).ReturnsAsync(() => new ActionResultDto<GameDto>
        {
            Result = null,
            Success = true,
        });

        var game = await _service.Delete(_game!.Id, _token);

        _underlyingService.Verify(s => s.Delete(_game.Id, _token));
        Assert.That(game.Result, Is.Null);
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task Upsert_WhenNotPermitted_ExcludesSubmissionsFromResult(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _user.SetAccess(inputResults: inputResults);
        var command = new Mock<IUpdateCommand<CosmosGame, CosmosGame>>();
        _underlyingService.Setup(s => s.Upsert(_game!.Id, command.Object, _token)).ReturnsAsync(() => new ActionResultDto<GameDto>
        {
            Result = _game,
            Success = true,
        });

        var game = await _service.Upsert(_game!.Id, command.Object, _token);

        _underlyingService.Verify(s => s.Upsert(_game.Id, command.Object, _token));
        Assert.That(game.Result!.HomeSubmission, Is.Null);
        Assert.That(game.Result!.AwaySubmission, Is.Null);
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task Upsert_WhenNotPermitted_ReturnsNull(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _user.SetAccess(inputResults: inputResults);
        var command = new Mock<IUpdateCommand<CosmosGame, CosmosGame>>();
        _underlyingService.Setup(s => s.Upsert(_game!.Id, command.Object, _token)).ReturnsAsync(() => new ActionResultDto<GameDto>
        {
            Result = null,
            Success = true,
        });

        var game = await _service.Upsert(_game!.Id, command.Object, _token);

        _underlyingService.Verify(s => s.Upsert(_game.Id, command.Object, _token));
        Assert.That(game.Result, Is.Null);
    }

    [Test]
    public async Task DeleteUnplayedLeagueFixtures_WhenNotLoggedOut_ReturnsUnsuccessful()
    {
        _user = null;

        var result = await _service.DeleteUnplayedLeagueFixtures(SeasonId, true, _token);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task DeleteUnplayedLeagueFixtures_WhenNotPermitted_ReturnsUnsuccessful()
    {
        _user!.Access!.BulkDeleteLeagueFixtures = false;

        var result = await _service.DeleteUnplayedLeagueFixtures(SeasonId, true, _token);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task DeleteUnplayedLeagueFixtures_WhenDryRun_FindsButDoesNotDeleteFixtures()
    {
        _user!.Access!.BulkDeleteLeagueFixtures = true;

        var result = await _service.DeleteUnplayedLeagueFixtures(SeasonId, true, _token);

        Assert.That(result.Success, Is.True);
        _deletableRepository.Verify(d => d.Delete(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task DeleteUnplayedLeagueFixtures_WhenDryRun_WouldDeleteFixtureWithNoMatches()
    {
        _user!.Access!.BulkDeleteLeagueFixtures = true;

        var result = await _service.DeleteUnplayedLeagueFixtures(SeasonId, true, _token);

        Assert.That(result.Result, Is.EquivalentTo(new[] { $"{_game!.Id} - 3 Feb 2001 (home vs away)" }));
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task DeleteUnplayedLeagueFixtures_WhenDryRun_WouldNotDeleteFixtureWhereMatchHasAHomeScore()
    {
        _game!.Matches.Add(new GameMatchDto { HomeScore = 1 });
        _user!.Access!.BulkDeleteLeagueFixtures = true;

        var result = await _service.DeleteUnplayedLeagueFixtures(SeasonId, true, _token);

        Assert.That(result.Result, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task DeleteUnplayedLeagueFixtures_WhenDryRun_WouldNotDeleteFixtureWhereMatchHasAnAwayScore()
    {
        _game!.Matches.Add(new GameMatchDto { AwayScore = 2 });
        _user!.Access!.BulkDeleteLeagueFixtures = true;

        var result = await _service.DeleteUnplayedLeagueFixtures(SeasonId, true, _token);

        Assert.That(result.Result, Is.Empty);
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task DeleteUnplayedLeagueFixtures_WhenDryRun_WouldDeleteFixtureWhereMatchScoresAre0()
    {
        _game!.Matches.Add(new GameMatchDto { HomeScore = 0, AwayScore = 0 });
        _user!.Access!.BulkDeleteLeagueFixtures = true;

        var result = await _service.DeleteUnplayedLeagueFixtures(SeasonId, true, _token);

        Assert.That(result.Result, Is.EquivalentTo(new[] { $"{_game!.Id} - 3 Feb 2001 (home vs away)" }));
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task DeleteUnplayedLeagueFixtures_WhenDryRun_WouldDeleteFixtureWhereMatchScoresAreNull()
    {
        _game!.Matches.Add(new GameMatchDto());
        _user!.Access!.BulkDeleteLeagueFixtures = true;

        var result = await _service.DeleteUnplayedLeagueFixtures(SeasonId, true, _token);

        Assert.That(result.Result, Is.EquivalentTo(new[] { $"{_game!.Id} - 3 Feb 2001 (home vs away)" }));
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task DeleteUnplayedLeagueFixtures_WhenNotDryRun_FindsAndDeletesFixtures()
    {
        _user!.Access!.BulkDeleteLeagueFixtures = true;

        var result = await _service.DeleteUnplayedLeagueFixtures(SeasonId, false, _token);

        Assert.That(result.Result, Is.EquivalentTo(new[] { $"{_game!.Id} - 3 Feb 2001 (home vs away)" }));
        Assert.That(result.Success, Is.True);
        _deletableRepository.Verify(d => d.Delete(_game.Id, _token));
    }
}