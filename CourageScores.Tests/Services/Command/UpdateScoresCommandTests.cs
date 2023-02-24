using CourageScores.Filters;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using CourageScores.Services.Team;
using CourageScores.Tests.Models.Adapters;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class UpdateScoresCommandTests
{
    private static readonly ScoreAsYouGo ScoreAsYouGo = new ScoreAsYouGo();
    private static readonly ScoreAsYouGoDto ScoreAsYouGoDto = new ScoreAsYouGoDto();
    private const string UserTeamId = "621BADAE-8FB0-4854-8C7A-6BC185117238";
    private Mock<IUserService> _userService = null!;
    private Mock<IAdapter<CourageScores.Models.Cosmos.Game.Game, GameDto>> _gameAdapter = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private Mock<ISeasonService> _seasonService = null!;
    private Mock<ICommandFactory> _commandFactory = null!;
    private Mock<ITeamService> _teamService = null!;
    private Mock<AddSeasonToTeamCommand> _addSeasonToTeamCommand = null!;
    private UpdateScoresCommand _command = null!;
    private readonly CancellationToken _token = new CancellationToken();
    private CourageScores.Models.Cosmos.Game.Game _game = null!;
    private RecordScoresDto _scores = null!;
    private UserDto? _user;
    private SeasonDto[] _seasons = null!;
    private ActionResultDto<TeamDto> _teamUpdate = new ActionResultDto<TeamDto> { Success = true };
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?> _matchOptionAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _gameAdapter = new Mock<IAdapter<CourageScores.Models.Cosmos.Game.Game, GameDto>>();
        _auditingHelper = new Mock<IAuditingHelper>();
        _seasonService = new Mock<ISeasonService>();
        _commandFactory = new Mock<ICommandFactory>();
        _teamService = new Mock<ITeamService>();
        _cacheFlags = new ScopedCacheManagementFlags();
        _addSeasonToTeamCommand = new Mock<AddSeasonToTeamCommand>(_auditingHelper.Object, _seasonService.Object, _cacheFlags);
        _matchOptionAdapter = new MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?>(null, null);
        _command = new UpdateScoresCommand(
            _userService.Object,
            _gameAdapter.Object,
            _matchOptionAdapter,
            new MockSimpleAdapter<ScoreAsYouGo, ScoreAsYouGoDto>(ScoreAsYouGo, ScoreAsYouGoDto),
            _auditingHelper.Object,
            _seasonService.Object,
            _commandFactory.Object,
            _teamService.Object,
            _cacheFlags);
        _game = new CourageScores.Models.Cosmos.Game.Game
        {
            Home = new GameTeam(),
            Away = new GameTeam(),
        };
        _scores = new RecordScoresDto();
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageScores = true
            },
            TeamId = Guid.Parse(UserTeamId),
        };
        _seasons = Array.Empty<SeasonDto>();

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _seasonService.Setup(s => s.GetAll(_token)).Returns(() => TestUtilities.AsyncEnumerable(_seasons));
        _commandFactory.Setup(f => f.GetCommand<AddSeasonToTeamCommand>()).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.CopyPlayersFromSeasonId(It.IsAny<Guid>())).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.ForSeason(It.IsAny<Guid>())).Returns(_addSeasonToTeamCommand.Object);
        _teamService
            .Setup(s => s.Upsert(It.IsAny<Guid>(), It.IsAny<AddSeasonToTeamCommand>(), _token))
            .ReturnsAsync(() => _teamUpdate);
    }

    [Test]
    public async Task ApplyUpdate_WhenGameDeleted_ReturnsUnsuccessful()
    {
        _game.Deleted = new DateTime(2001, 02, 03);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Cannot edit a game that has been deleted"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        _user = null;

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Game cannot be updated, not logged in"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [TestCase(false, false, null, null, null)]
    [TestCase(false, true, null, null, null)]
    [TestCase(false, false, UserTeamId, null, null)]
    [TestCase(false, true, "88A65752-CBB1-4046-B30A-A7ECB9811F2A", null, null)]
    [TestCase(false, false, UserTeamId, UserTeamId, UserTeamId)]
    public async Task ApplyUpdate_WhenNotLoggedIn_ReturnsUnsuccessful(bool manageScores, bool inputResults, string? userTeamId, string? homeTeamId, string? awayTeamId)
    {
        _user!.Access!.ManageScores = manageScores;
        _user!.Access!.InputResults = inputResults;
        _user!.TeamId = userTeamId != null ? Guid.Parse(userTeamId) : null;
        _game.Home.Id = homeTeamId != null ? Guid.Parse(homeTeamId) : Guid.Empty;
        _game.Away.Id = awayTeamId != null ? Guid.Parse(awayTeamId) : Guid.Empty;

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Game cannot be updated, not permitted"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [TestCase(false, false)]
    [TestCase(true, true)]
    public async Task ApplyUpdate_WhenPermittedToManageScores_UpdatesResultsAndReturnsSuccessful(bool permittedToRecordScoresAsYouGo, bool saygSet)
    {
        _user!.Access!.ManageScores = true;
        _user!.Access!.RecordScoresAsYouGo = permittedToRecordScoresAsYouGo;
        var homePlayer1 = new RecordScoresDto.RecordScoresGamePlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME PLAYER",
        };
        var awayPlayer1 = new RecordScoresDto.GameOver100CheckoutDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY PLAYER",
            Notes = "150",
        };
        var match1 = new RecordScoresDto.RecordScoresGameMatchDto
        {
            HomePlayers = { homePlayer1 },
            AwayPlayers = { awayPlayer1 },
            HomeScore = 1,
            AwayScore = 2,
            Sayg = ScoreAsYouGoDto,
        };
        _scores.Matches.Add(match1);
        _scores.OneEighties.Add(homePlayer1);
        _scores.Over100Checkouts.Add(awayPlayer1);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Message, Is.EqualTo("Scores updated"));
        Assert.That(result.Success, Is.True);
        Assert.That(_game.Matches[0].HomeScore, Is.EqualTo(match1.HomeScore));
        Assert.That(_game.Matches[0].AwayScore, Is.EqualTo(match1.AwayScore));
        Assert.That(_game.Matches[0].HomePlayers[0].Id, Is.EqualTo(homePlayer1.Id));
        Assert.That(_game.Matches[0].HomePlayers[0].Name, Is.EqualTo(homePlayer1.Name));
        Assert.That(_game.Matches[0].AwayPlayers[0].Id, Is.EqualTo(awayPlayer1.Id));
        Assert.That(_game.Matches[0].AwayPlayers[0].Name, Is.EqualTo(awayPlayer1.Name));
        Assert.That(_game.Matches[0].Sayg, Is.EqualTo(saygSet ? ScoreAsYouGo : null));
        Assert.That(_game.OneEighties[0].Id, Is.EqualTo(homePlayer1.Id));
        Assert.That(_game.OneEighties[0].Name, Is.EqualTo(homePlayer1.Name));
        Assert.That(_game.Over100Checkouts[0].Name, Is.EqualTo(awayPlayer1.Name));
        Assert.That(_game.Over100Checkouts[0].Notes, Is.EqualTo("150"));
        Assert.That(_game.Matches[0].Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_game.DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
    }

    [Test]
    public async Task ApplyUpdate_WhenUpdatingMatches_UpdatesResultsAndReturnsSuccessful()
    {
        _game.Matches.Add(new GameMatch
        {
            Id = Guid.NewGuid(),
        });
        _user!.Access!.ManageScores = true;
        var homePlayer1 = new RecordScoresDto.RecordScoresGamePlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME PLAYER",
        };
        var awayPlayer1 = new RecordScoresDto.GameOver100CheckoutDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY PLAYER",
            Notes = "150",
        };
        var match1 = new RecordScoresDto.RecordScoresGameMatchDto
        {
            HomePlayers = { homePlayer1 },
            AwayPlayers = { awayPlayer1 },
            HomeScore = 1,
            AwayScore = 2,
        };
        _scores.Matches.Add(match1);
        _scores.OneEighties.Add(homePlayer1);
        _scores.Over100Checkouts.Add(awayPlayer1);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Message, Is.EqualTo("Scores updated"));
        Assert.That(result.Success, Is.True);
        Assert.That(_game.Matches[0].HomeScore, Is.EqualTo(match1.HomeScore));
        Assert.That(_game.Matches[0].AwayScore, Is.EqualTo(match1.AwayScore));
        Assert.That(_game.Matches[0].HomePlayers[0].Id, Is.EqualTo(homePlayer1.Id));
        Assert.That(_game.Matches[0].HomePlayers[0].Name, Is.EqualTo(homePlayer1.Name));
        Assert.That(_game.Matches[0].AwayPlayers[0].Id, Is.EqualTo(awayPlayer1.Id));
        Assert.That(_game.Matches[0].AwayPlayers[0].Name, Is.EqualTo(awayPlayer1.Name));
        Assert.That(_game.OneEighties[0].Id, Is.EqualTo(homePlayer1.Id));
        Assert.That(_game.OneEighties[0].Name, Is.EqualTo(homePlayer1.Name));
        Assert.That(_game.Over100Checkouts[0].Name, Is.EqualTo(awayPlayer1.Name));
        Assert.That(_game.Over100Checkouts[0].Notes, Is.EqualTo("150"));
        Assert.That(_game.Matches[0].Id, Is.EqualTo(_game.Matches.Single().Id));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_game.DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
    }

    [Test]
    public async Task ApplyUpdate_WhenResultsPublished_ReturnsUnsuccessful()
    {
        _user!.Access!.ManageScores = false;
        _user!.Access!.InputResults = true;
        _game.Away.Id = Guid.Parse(UserTeamId);
        var homePlayer1 = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "HOME PLAYER",
        };
        var awayPlayer1 = new NotablePlayer
        {
            Id = Guid.NewGuid(),
            Name = "AWAY PLAYER",
            Notes = "150",
        };
        var match1 = new GameMatch
        {
            HomePlayers = { homePlayer1 },
            AwayPlayers = { awayPlayer1 },
            HomeScore = 1,
            AwayScore = 2
        };
        _game.Matches.Add(match1);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Submissions cannot be accepted, scores have been published"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenPermittedToInputResults_UpdatesHomeSubmissionAndReturnsSuccessful()
    {
        _user!.Access!.ManageScores = false;
        _user!.Access!.InputResults = true;
        _game.Home.Id = Guid.Parse(UserTeamId);

        var homePlayer1 = new RecordScoresDto.RecordScoresGamePlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME PLAYER",
        };
        var awayPlayer1 = new RecordScoresDto.GameOver100CheckoutDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY PLAYER",
            Notes = "150",
        };
        var match1 = new RecordScoresDto.RecordScoresGameMatchDto
        {
            HomePlayers = { homePlayer1 },
            AwayPlayers = { awayPlayer1 },
            HomeScore = 1,
            AwayScore = 2,
        };
        _scores.Matches.Add(match1);
        _scores.OneEighties.Add(homePlayer1);
        _scores.Over100Checkouts.Add(awayPlayer1);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Message, Is.EqualTo("Scores updated"));
        Assert.That(result.Success, Is.True);
        Assert.That(_game.HomeSubmission, Is.Not.Null);
        Assert.That(_game.HomeSubmission!.Matches[0].HomeScore, Is.EqualTo(match1.HomeScore));
        Assert.That(_game.HomeSubmission!.Matches[0].AwayScore, Is.EqualTo(match1.AwayScore));
        Assert.That(_game.HomeSubmission!.Matches[0].HomePlayers[0].Id, Is.EqualTo(homePlayer1.Id));
        Assert.That(_game.HomeSubmission!.Matches[0].HomePlayers[0].Name, Is.EqualTo(homePlayer1.Name));
        Assert.That(_game.HomeSubmission!.Matches[0].AwayPlayers[0].Id, Is.EqualTo(awayPlayer1.Id));
        Assert.That(_game.HomeSubmission!.Matches[0].AwayPlayers[0].Name, Is.EqualTo(awayPlayer1.Name));
        Assert.That(_game.HomeSubmission!.OneEighties[0].Id, Is.EqualTo(homePlayer1.Id));
        Assert.That(_game.HomeSubmission!.OneEighties[0].Name, Is.EqualTo(homePlayer1.Name));
        Assert.That(_game.HomeSubmission!.Over100Checkouts[0].Name, Is.EqualTo(awayPlayer1.Name));
        Assert.That(_game.HomeSubmission!.Over100Checkouts[0].Notes, Is.EqualTo("150"));
        Assert.That(_game.HomeSubmission!.Matches[0].Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenPermittedToInputResults_UpdatesAwaySubmissionAndReturnsSuccessful()
    {
        _user!.Access!.ManageScores = false;
        _user!.Access!.InputResults = true;
        _game.Away.Id = Guid.Parse(UserTeamId);
        var homePlayer1 = new RecordScoresDto.RecordScoresGamePlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME PLAYER",
        };
        var awayPlayer1 = new RecordScoresDto.GameOver100CheckoutDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY PLAYER",
            Notes = "150",
        };
        var match1 = new RecordScoresDto.RecordScoresGameMatchDto
        {
            HomePlayers = { homePlayer1 },
            AwayPlayers = { awayPlayer1 },
            HomeScore = 1,
            AwayScore = 2,
        };
        _scores.Matches.Add(match1);
        _scores.OneEighties.Add(homePlayer1);
        _scores.Over100Checkouts.Add(awayPlayer1);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Message, Is.EqualTo("Scores updated"));
        Assert.That(result.Success, Is.True);
        Assert.That(_game.AwaySubmission, Is.Not.Null);
        Assert.That(_game.AwaySubmission!.Matches[0].HomeScore, Is.EqualTo(match1.HomeScore));
        Assert.That(_game.AwaySubmission!.Matches[0].AwayScore, Is.EqualTo(match1.AwayScore));
        Assert.That(_game.AwaySubmission!.Matches[0].HomePlayers[0].Id, Is.EqualTo(homePlayer1.Id));
        Assert.That(_game.AwaySubmission!.Matches[0].HomePlayers[0].Name, Is.EqualTo(homePlayer1.Name));
        Assert.That(_game.AwaySubmission!.Matches[0].AwayPlayers[0].Id, Is.EqualTo(awayPlayer1.Id));
        Assert.That(_game.AwaySubmission!.Matches[0].AwayPlayers[0].Name, Is.EqualTo(awayPlayer1.Name));
        Assert.That(_game.AwaySubmission!.OneEighties[0].Id, Is.EqualTo(homePlayer1.Id));
        Assert.That(_game.AwaySubmission!.OneEighties[0].Name, Is.EqualTo(homePlayer1.Name));
        Assert.That(_game.AwaySubmission!.Over100Checkouts[0].Name, Is.EqualTo(awayPlayer1.Name));
        Assert.That(_game.AwaySubmission!.Over100Checkouts[0].Notes, Is.EqualTo("150"));
        Assert.That(_game.AwaySubmission!.Matches[0].Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenPermittedToManageGames_UpdatesGameDetailsAndReturnsSuccessful()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
            StartDate = new DateTime(2001, 02, 03),
            EndDate = new DateTime(2002, 03, 04),
        };
        _game.Date = new DateTime(2001, 02, 03);
        _user!.Access!.ManageGames = true;
        _seasons = new[]
        {
            season
        };
        _scores.Address = "new address";
        _scores.Postponed = true;
        _scores.IsKnockout = true;
        _scores.Date = new DateTime(2001, 02, 04);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Scores updated"));
        Assert.That(_game.Address, Is.EqualTo("new address"));
        Assert.That(_game.Postponed, Is.True);
        Assert.That(_game.IsKnockout, Is.True);
        Assert.That(_game.Date, Is.EqualTo(new DateTime(2001, 02, 04)));
        Assert.That(_game.SeasonId, Is.EqualTo(season.Id));
        _teamService.Verify(c => c.Upsert(_game.Home.Id, _addSeasonToTeamCommand.Object, _token));
        _teamService.Verify(c => c.Upsert(_game.Away.Id, _addSeasonToTeamCommand.Object, _token));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_game.DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
    }

    [Test]
    public async Task ApplyUpdate_WhenUpdateGameDetailsFails_ReturnsFailureDetail()
    {
        _teamUpdate = new ActionResultDto<TeamDto>
        {
            Success = false,
            Errors = { "error" },
            Warnings = { "warning" },
            Messages = { "message" },
        };
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
            StartDate = new DateTime(2001, 02, 03),
            EndDate = new DateTime(2002, 03, 04),
        };
        _game.Date = new DateTime(2001, 02, 03);
        _user!.Access!.ManageGames = true;
        _seasons = new[]
        {
            season
        };
        _scores.Address = "new address";
        _scores.Postponed = true;
        _scores.IsKnockout = true;
        _scores.Date = new DateTime(2001, 02, 04);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Could not add season to home and/or away teams: Home: Success: False, Errors: error, Warnings: warning, Messages: message, Away: Success: False, Errors: error, Warnings: warning, Messages: message"));
    }
}