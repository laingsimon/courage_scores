using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Game;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Game;

[TestFixture]
public class GameServiceTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private GameDto? _game;
    private Mock<IUserService> _userService = null!;
    private Mock<IGenericDataService<CourageScores.Models.Cosmos.Game.Game,GameDto>> _underlyingService = null!;
    private UserDto? _user;
    private GameService _service = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _underlyingService = new Mock<IGenericDataService<CourageScores.Models.Cosmos.Game.Game, GameDto>>();
        _service = new GameService(_underlyingService.Object, _userService.Object);
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
            SeasonId = Guid.NewGuid(),
            IsKnockout = true,
        };
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageScores = false,
            }
        };
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
        _user!.Access!.ManageScores = true;

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result, Is.SameAs(_game));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task Get_WhenNotPermitted_ShouldExcludeSubmissions(bool loggedIn, bool inputResults)
    {
        _game!.HomeSubmission = new GameDto();
        _game!.AwaySubmission = new GameDto();
        _user!.Access!.InputResults = inputResults;
        _user = loggedIn ? _user : null;

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result!.HomeSubmission, Is.Null);
        Assert.That(result.AwaySubmission, Is.Null);
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task Get_WhenResultsPublished_ShouldReturnGame(bool loggedIn, bool inputResults)
    {
        _game!.HomeSubmission = new GameDto();
        _game!.AwaySubmission = new GameDto();
        _user!.Access!.InputResults = inputResults;
        _user = loggedIn ? _user : null;
        _game.ResultsPublished = true;

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result, Is.SameAs(_game));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task Get_WhenResultsUnpublishedAndNotPermitted_ShouldReturnGame(bool loggedIn, bool inputResults)
    {
        _game!.HomeSubmission = new GameDto();
        _game!.AwaySubmission = new GameDto();
        _user!.Access!.InputResults = inputResults;
        _user = loggedIn ? _user : null;

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result, Is.SameAs(_game));
    }

    [Test]
    public async Task Get_WhenResultsUnpublishedUserCanInputResultsForHomeTeam_ShouldReturnHomeTeamSubmission()
    {
        _game!.HomeSubmission = new GameDto { Matches = new List<GameMatchDto>() };
        _game!.AwaySubmission = new GameDto { Matches = new List<GameMatchDto>() };
        _user!.Access!.InputResults = true;
        _user.TeamId = _game.Home.Id;

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result!.Matches, Is.SameAs(_game.HomeSubmission.Matches));
        AssertSubmissionHasGameProperties(result, _game);
    }

    [Test]
    public async Task Get_WhenResultsUnpublishedUserCanInputResultsForAwayTeam_ShouldReturnHomeTeamSubmission()
    {
        _game!.HomeSubmission = new GameDto { Matches = new List<GameMatchDto>() };
        _game!.AwaySubmission = new GameDto { Matches = new List<GameMatchDto>() };
        _user!.Access!.InputResults = true;
        _user.TeamId = _game.Away.Id;

        var result = await _service.Get(_game!.Id, _token);

        Assert.That(result!.Matches, Is.SameAs(_game.AwaySubmission.Matches));
        AssertSubmissionHasGameProperties(result, _game);
    }

    [Test]
    public async Task GetAll_WhenLoggedInAsAnAdmin_ShouldReturnGame()
    {
        _user!.Access!.ManageScores = true;

        var games = await _service.GetAll(_token).ToList();

        _underlyingService.Verify(s => s.GetAll(_token));
        Assert.That(games.Single(), Is.SameAs(_game));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task GetAll_WhenNotPermitted_ShouldExcludeSubmissions(bool loggedIn, bool inputResults)
    {
        _game!.HomeSubmission = new GameDto();
        _game!.AwaySubmission = new GameDto();
        _user!.Access!.InputResults = inputResults;
        _user = loggedIn ? _user : null;

        var games = await _service.GetAll(_token).ToList();

        Assert.That(games.Single().HomeSubmission, Is.Null);
        Assert.That(games.Single().AwaySubmission, Is.Null);
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task GetAll_WhenResultsPublished_ShouldReturnGame(bool loggedIn, bool inputResults)
    {
        _game!.HomeSubmission = new GameDto();
        _game!.AwaySubmission = new GameDto();
        _user!.Access!.InputResults = inputResults;
        _user = loggedIn ? _user : null;
        _game.ResultsPublished = true;

        var games = await _service.GetAll(_token).ToList();

        Assert.That(games.Single(), Is.SameAs(_game));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task GetAll_WhenResultsUnpublishedAndNotPermitted_ShouldReturnGame(bool loggedIn, bool inputResults)
    {
        _game!.HomeSubmission = new GameDto();
        _game!.AwaySubmission = new GameDto();
        _user!.Access!.InputResults = inputResults;
        _user = loggedIn ? _user : null;

        var games = await _service.GetAll(_token).ToList();

        Assert.That(games.Single(), Is.SameAs(_game));
    }

    [Test]
    public async Task GetAll_WhenResultsUnpublishedUserCanInputResultsForHomeTeam_ShouldReturnHomeTeamSubmission()
    {
        _game!.HomeSubmission = new GameDto { Matches = new List<GameMatchDto>() };
        _game!.AwaySubmission = new GameDto { Matches = new List<GameMatchDto>() };
        _user!.Access!.InputResults = true;
        _user.TeamId = _game.Home.Id;

        var games = await _service.GetAll(_token).ToList();

        Assert.That(games.Single().Matches, Is.SameAs(_game.HomeSubmission.Matches));
        AssertSubmissionHasGameProperties(games.Single(), _game);
    }

    [Test]
    public async Task GetAll_WhenResultsUnpublishedUserCanInputResultsForAwayTeam_ShouldReturnHomeTeamSubmission()
    {
        _game!.HomeSubmission = new GameDto { Matches = new List<GameMatchDto>() };
        _game!.AwaySubmission = new GameDto { Matches = new List<GameMatchDto>() };
        _user!.Access!.InputResults = true;
        _user.TeamId = _game.Away.Id;

        var games = await _service.GetAll(_token).ToList();

        Assert.That(games.Single().Matches, Is.SameAs(_game.AwaySubmission.Matches));
        AssertSubmissionHasGameProperties(games.Single(), _game);
    }

    [Test]
    public async Task GetWhere_WhenLoggedInAsAnAdmin_ShouldReturnGame()
    {
        _user!.Access!.ManageScores = true;

        var games = await _service.GetWhere("query", _token).ToList();

        _underlyingService.Verify(s => s.GetWhere("query", _token));
        Assert.That(games.Single(), Is.SameAs(_game));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task GetWhere_WhenNotPermitted_ShouldExcludeSubmissions(bool loggedIn, bool inputResults)
    {
        _game!.HomeSubmission = new GameDto();
        _game!.AwaySubmission = new GameDto();
        _user!.Access!.InputResults = inputResults;
        _user = loggedIn ? _user : null;

        var games = await _service.GetWhere("query", _token).ToList();

        Assert.That(games.Single().HomeSubmission, Is.Null);
        Assert.That(games.Single().AwaySubmission, Is.Null);
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task GetWhere_WhenResultsPublished_ShouldReturnGame(bool loggedIn, bool inputResults)
    {
        _game!.HomeSubmission = new GameDto();
        _game!.AwaySubmission = new GameDto();
        _user!.Access!.InputResults = inputResults;
        _user = loggedIn ? _user : null;
        _game.ResultsPublished = true;

        var games = await _service.GetWhere("query", _token).ToList();

        Assert.That(games.Single(), Is.SameAs(_game));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    public async Task GetWhere_WhenResultsUnpublishedAndNotPermitted_ShouldReturnGame(bool loggedIn, bool inputResults)
    {
        _game!.HomeSubmission = new GameDto();
        _game!.AwaySubmission = new GameDto();
        _user!.Access!.InputResults = inputResults;
        _user = loggedIn ? _user : null;

        var games = await _service.GetWhere("query", _token).ToList();

        Assert.That(games.Single(), Is.SameAs(_game));
    }

    [Test]
    public async Task GetWhere_WhenResultsUnpublishedUserCanInputResultsForHomeTeam_ShouldReturnHomeTeamSubmission()
    {
        _game!.HomeSubmission = new GameDto { Matches = new List<GameMatchDto>() };
        _game!.AwaySubmission = new GameDto { Matches = new List<GameMatchDto>() };
        _user!.Access!.InputResults = true;
        _user.TeamId = _game.Home.Id;

        var games = await _service.GetWhere("query", _token).ToList();

        Assert.That(games.Single().Matches, Is.SameAs(_game.HomeSubmission.Matches));
        AssertSubmissionHasGameProperties(games.Single(), _game);
    }

    [Test]
    public async Task GetWhere_WhenResultsUnpublishedUserCanInputResultsForAwayTeam_ShouldReturnHomeTeamSubmission()
    {
        _game!.HomeSubmission = new GameDto { Matches = new List<GameMatchDto>() };
        _game!.AwaySubmission = new GameDto { Matches = new List<GameMatchDto>() };
        _user!.Access!.InputResults = true;
        _user.TeamId = _game.Away.Id;

        var games = await _service.GetWhere("query", _token).ToList();

        Assert.That(games.Single().Matches, Is.SameAs(_game.AwaySubmission.Matches));
        AssertSubmissionHasGameProperties(games.Single(), _game);
    }

    private static void AssertSubmissionHasGameProperties(GameDto submission, GameDto game)
    {
        Assert.That(submission.Id, Is.EqualTo(game.Id));
        Assert.That(submission.Away, Is.EqualTo(game.Away));
        Assert.That(submission.Home, Is.EqualTo(game.Home));
        Assert.That(submission.Address, Is.EqualTo(game.Address));
        Assert.That(submission.Date, Is.EqualTo(game.Date));
        Assert.That(submission.Postponed, Is.EqualTo(game.Postponed));
        Assert.That(submission.DivisionId, Is.EqualTo(game.DivisionId));
        Assert.That(submission.IsKnockout, Is.EqualTo(game.IsKnockout));
        Assert.That(submission.SeasonId, Is.EqualTo(game.SeasonId));
    }
}