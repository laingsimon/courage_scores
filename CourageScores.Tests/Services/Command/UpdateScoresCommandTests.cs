using CourageScores.Filters;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Season;
using CourageScores.Models.Cosmos.Game;
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
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class UpdateScoresCommandTests
{
    private static readonly RecordScoresDto.RecordScoresGamePlayerDto HomePlayer = new RecordScoresDto.RecordScoresGamePlayerDto
    {
        Id = Guid.NewGuid(),
        Name = "HOME PLAYER",
    };
    private static readonly RecordScoresDto.GameOver100CheckoutDto AwayPlayer = new RecordScoresDto.GameOver100CheckoutDto
    {
        Id = Guid.NewGuid(),
        Name = "AWAY PLAYER",
        Score = 150,
    };
    private static readonly ScoreAsYouGoDto ScoreAsYouGoDto = new();
    private static readonly RecordScoresDto.RecordScoresGameMatchDto AwayWinnerMatch = new RecordScoresDto.RecordScoresGameMatchDto
    {
        HomePlayers =
        {
            HomePlayer,
        },
        AwayPlayers =
        {
            AwayPlayer,
        },
        HomeScore = 1,
        AwayScore = 2,
        Sayg = ScoreAsYouGoDto,
    };
    private static readonly NotablePlayer Over100CheckoutPlayer = new NotablePlayer
    {
        Id = Guid.NewGuid(),
        Name = "AWAY PLAYER",
        Notes = "150",
    };
    private static readonly GamePlayer HomeGamePlayer = new GamePlayer
    {
        Id = Guid.NewGuid(),
        Name = "HOME PLAYER",
    };
    private static readonly GameMatch AdaptedGameMatch = new GameMatch();
    private static readonly SeasonDto SeasonDto = new SeasonDto
    {
        Id = Guid.NewGuid(),
        StartDate = new DateTime(2001, 02, 03),
        EndDate = new DateTime(2002, 03, 04),
    };

    private const string UserTeamId = "621BADAE-8FB0-4854-8C7A-6BC185117238";
    private Mock<IUserService> _userService = null!;
    private Mock<IAdapter<CosmosGame, GameDto>> _gameAdapter = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private Mock<ICachingSeasonService> _seasonService = null!;
    private Mock<ICommandFactory> _commandFactory = null!;
    private Mock<ITeamService> _teamService = null!;
    private Mock<AddSeasonToTeamCommand> _addSeasonToTeamCommand = null!;
    private UpdateScoresCommand _command = null!;
    private readonly CancellationToken _token = new();
    private CosmosGame _game = null!;
    private RecordScoresDto _scores = null!;
    private UserDto? _user;
    private ActionResultDto<TeamDto> _teamUpdate = new()
    {
        Success = true,
    };
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?> _matchOptionAdapter = null!;
    private Mock<IUpdateScoresAdapter> _scoresAdapter = null!;
    private Mock<IEqualityComparer<CosmosGame>> _submissionComparer = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _gameAdapter = new Mock<IAdapter<CosmosGame, GameDto>>();
        _auditingHelper = new Mock<IAuditingHelper>();
        _seasonService = new Mock<ICachingSeasonService>();
        _commandFactory = new Mock<ICommandFactory>();
        _teamService = new Mock<ITeamService>();
        _cacheFlags = new ScopedCacheManagementFlags();
        _addSeasonToTeamCommand = new Mock<AddSeasonToTeamCommand>(_auditingHelper.Object, _seasonService.Object, _cacheFlags);
        _matchOptionAdapter = new MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?>(null, null);
        _scoresAdapter = new Mock<IUpdateScoresAdapter>();
        _submissionComparer = new Mock<IEqualityComparer<CosmosGame>>();
        _command = new UpdateScoresCommand(
            _userService.Object,
            _gameAdapter.Object,
            _matchOptionAdapter,
            _auditingHelper.Object,
            _seasonService.Object,
            _commandFactory.Object,
            _teamService.Object,
            _cacheFlags,
            _scoresAdapter.Object,
            _submissionComparer.Object);
        _game = new CosmosGame
        {
            Home = new GameTeam(),
            Away = new GameTeam(),
            Updated = new DateTime(2001, 02, 03),
            Editor = "EDITOR",
        };
        _scores = new RecordScoresDto
        {
            LastUpdated = new DateTime(2001, 02, 03),
        };
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageScores = true,
            },
            TeamId = Guid.Parse(UserTeamId),
        };

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _commandFactory.Setup(f => f.GetCommand<AddSeasonToTeamCommand>()).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.CopyPlayersFromSeasonId(It.IsAny<Guid>())).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.ForSeason(It.IsAny<Guid>())).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.ForDivision(It.IsAny<Guid>())).Returns(_addSeasonToTeamCommand.Object);
        _teamService
            .Setup(s => s.Upsert(It.IsAny<Guid>(), It.IsAny<AddSeasonToTeamCommand>(), _token))
            .ReturnsAsync(() => _teamUpdate);
        _scoresAdapter.Setup(a => a.AdaptToHiCheckPlayer(AwayPlayer, _token)).ReturnsAsync(Over100CheckoutPlayer);
        _scoresAdapter.Setup(a => a.AdaptToPlayer(HomePlayer, _token)).ReturnsAsync(HomeGamePlayer);
        _scoresAdapter.Setup(a => a.AdaptToMatch(AwayWinnerMatch, _token)).ReturnsAsync(AdaptedGameMatch);
    }

    [Test]
    public void ApplyUpdate_WithoutData_Throws()
    {
        Assert.That(
            async () => await _command.ApplyUpdate(_game, _token),
            Throws.InvalidOperationException);
    }

    [Test]
    public async Task ApplyUpdate_WhenGameDeleted_ReturnsUnsuccessful()
    {
        _game.Deleted = new DateTime(2001, 02, 03);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Cannot edit a game that has been deleted",
        }));
        AssertCacheEviction(divisionId: null, seasonId: null);
    }

    [Test]
    public async Task ApplyUpdate_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        _user = null;

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Game cannot be updated, not logged in",
        }));
        AssertCacheEviction(divisionId: null, seasonId: null);
    }

    [TestCase(false, false, null, null, null)]
    [TestCase(false, true, null, null, null)]
    [TestCase(false, false, UserTeamId, null, null)]
    [TestCase(false, true, "88A65752-CBB1-4046-B30A-A7ECB9811F2A", null, null)]
    [TestCase(false, false, UserTeamId, UserTeamId, UserTeamId)]
    public async Task ApplyUpdate_WhenNotPermitted_ReturnsUnsuccessful(bool manageScores, bool inputResults, string? userTeamId, string? homeTeamId, string? awayTeamId)
    {
        SetAccess(manageScores: manageScores, inputResults: inputResults);
        _user!.TeamId = userTeamId != null ? Guid.Parse(userTeamId) : null;
        _game.Home.Id = homeTeamId != null ? Guid.Parse(homeTeamId) : Guid.Empty;
        _game.Away.Id = awayTeamId != null ? Guid.Parse(awayTeamId) : Guid.Empty;

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Game cannot be updated, not permitted",
        }));
        AssertCacheEviction(divisionId: null, seasonId: null);
    }

    [TestCase(false, false)]
    [TestCase(true, true)]
    public async Task ApplyUpdate_WhenPermittedToManageScores_UpdatesResultsAndReturnsSuccessful(bool permittedToRecordScoresAsYouGo, bool saygSet)
    {
        SetAccess(recordScoresAsYouGo: permittedToRecordScoresAsYouGo);
        _scores.Matches.Add(AwayWinnerMatch);
        _scores.OneEighties.Add(HomePlayer);
        _scores.Over100Checkouts.Add(AwayPlayer);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Game updated",
            "Scores updated",
        }));
        Assert.That(result.Success, Is.True);
        Assert.That(_game.Matches[0], Is.SameAs(AdaptedGameMatch));
        Assert.That(_game.OneEighties[0], Is.SameAs(HomeGamePlayer));
        Assert.That(_game.Over100Checkouts[0], Is.SameAs(Over100CheckoutPlayer));
        AssertCacheEviction(divisionId: _game.DivisionId, seasonId: _game.SeasonId);
    }

    [Test]
    public async Task ApplyUpdate_WhenLastUpdatedIsDifferent_ReturnsUnsuccessful()
    {
        SetAccess(recordScoresAsYouGo: true);
        _scores.LastUpdated = new DateTime(2004, 05, 06);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "Unable to update Game, EDITOR updated it before you at 3 Feb 2001 00:00:00",
        }));
        Assert.That(result.Success, Is.False);
        AssertCacheEviction(divisionId: null, seasonId: null);
    }

    [Test]
    public async Task ApplyUpdate_WhenLastUpdatedIsMissing_ReturnsUnsuccessful()
    {
        SetAccess(recordScoresAsYouGo: true);
        _scores.LastUpdated = null;

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "Unable to update Game, data integrity token is missing",
        }));
        Assert.That(result.Success, Is.False);
        AssertCacheEviction(divisionId: null, seasonId: null);
    }

    [Test]
    public async Task ApplyUpdate_WhenUpdatingMatches_UpdatesResultsAndReturnsSuccessful()
    {
        _game.Matches.Add(new GameMatch
        {
            Id = Guid.NewGuid(),
        });
        SetAccess();
        _scores.Matches.Add(AwayWinnerMatch);
        _scores.OneEighties.Add(HomePlayer);
        _scores.Over100Checkouts.Add(AwayPlayer);
        _scoresAdapter.Setup(a => a.UpdateMatch(_game.Matches.Last(), AwayWinnerMatch, _token)).ReturnsAsync(AdaptedGameMatch);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Game updated",
            "Scores updated",
        }));
        Assert.That(result.Success, Is.True);
        Assert.That(_game.Matches[0], Is.SameAs(AdaptedGameMatch));
        Assert.That(_game.OneEighties[0], Is.SameAs(HomeGamePlayer));
        Assert.That(_game.Over100Checkouts[0], Is.SameAs(Over100CheckoutPlayer));
        Assert.That(_game.Matches[0].Id, Is.EqualTo(_game.Matches.Single().Id));
        AssertCacheEviction(divisionId: _game.DivisionId, seasonId: _game.SeasonId);
    }

    [Test]
    public async Task ApplyUpdate_WhenMatchRemoved_RemovesMatch()
    {
        var matchToRemove = new GameMatch
        {
            Id = Guid.NewGuid(),
        };
        var matchToKeep = new GameMatch
        {
            Id = Guid.NewGuid(),
        };
        _game.Matches.Add(matchToKeep);
        _game.Matches.Add(matchToRemove);
        SetAccess();
        _scores.Matches.Add(AwayWinnerMatch);
        _scores.OneEighties.Add(HomePlayer);
        _scores.Over100Checkouts.Add(AwayPlayer);
        _scoresAdapter.Setup(a => a.UpdateMatch(matchToKeep, AwayWinnerMatch, _token)).ReturnsAsync(AdaptedGameMatch);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Game updated",
            "Scores updated",
        }));
        Assert.That(result.Success, Is.True);
        Assert.That(_game.Matches.Count, Is.EqualTo(1));
        Assert.That(_game.Matches, Is.EqualTo(new[] { AdaptedGameMatch })); // only 1 match
    }

    [Test]
    public async Task ApplyUpdate_WhenResultsPublished_ReturnsUnsuccessful()
    {
        SetAccess(manageScores: false, inputResults: true);
        _game.Away.Id = Guid.Parse(UserTeamId);
        _game.Matches.Add(AdaptedGameMatch);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Submissions cannot be accepted, scores have been published",
        }));
        AssertCacheEviction(divisionId: null, seasonId: null);
    }

    [Test]
    public async Task ApplyUpdate_WhenPermittedToInputResults_UpdatesHomeSubmissionAndReturnsSuccessful()
    {
        SetAccess(manageScores: false, inputResults: true);
        _game.Home.Id = Guid.Parse(UserTeamId);
        _scores.Home!.ManOfTheMatch = HomePlayer.Id;
        _scores.Matches.Add(AwayWinnerMatch);
        _scores.OneEighties.Add(HomePlayer);
        _scores.Over100Checkouts.Add(AwayPlayer);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Submission updated",
            "Scores updated",
        }));
        Assert.That(result.Success, Is.True);
        Assert.That(_game.HomeSubmission, Is.Not.Null);
        Assert.That(_game.HomeSubmission!.Matches[0], Is.SameAs(AdaptedGameMatch));
        Assert.That(_game.HomeSubmission!.OneEighties[0], Is.SameAs(HomeGamePlayer));
        Assert.That(_game.HomeSubmission!.Over100Checkouts[0], Is.SameAs(Over100CheckoutPlayer));
        Assert.That(_game.HomeSubmission!.Home.ManOfTheMatch, Is.EqualTo(HomePlayer.Id));
        Assert.That(_game.Home.ManOfTheMatch, Is.Null);
        AssertCacheEviction(divisionId: null, seasonId: null);
    }

    [Test]
    public async Task ApplyUpdate_WhenUpdatingHomeSubmissionAndMatchesAwaySubmission_PublishesScores()
    {
        SetAccess(manageScores: false, inputResults: true);
        _game.Home.Id = Guid.Parse(UserTeamId);
        _game.HomeSubmission = new CosmosGame
        {
            Home = new GameTeam { ManOfTheMatch = Guid.NewGuid() },
            Matches = { new GameMatch() },
            MatchOptions = { new GameMatchOption() },
            OneEighties = { new GamePlayer() },
            Over100Checkouts = { new NotablePlayer() },
            Editor = "EDITOR",
            Updated = _scores.LastUpdated!.Value,
        };
        _game.AwaySubmission = new CosmosGame
        {
            Away = new GameTeam { ManOfTheMatch = Guid.NewGuid() },
        };
        _submissionComparer.Setup(c => c.Equals(_game.HomeSubmission, _game.AwaySubmission)).Returns(true);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_game.AwaySubmission, Is.Not.Null);
        Assert.That(_game.HomeSubmission, Is.Not.Null);
        Assert.That(_game.Matches, Is.EqualTo(_game.HomeSubmission.Matches));
        Assert.That(_game.MatchOptions, Is.EqualTo(_game.HomeSubmission.MatchOptions));
        Assert.That(_game.OneEighties, Is.EqualTo(_game.HomeSubmission.OneEighties));
        Assert.That(_game.Over100Checkouts, Is.EqualTo(_game.HomeSubmission.Over100Checkouts));
        Assert.That(_game.Home.ManOfTheMatch, Is.EqualTo(_game.HomeSubmission.Home.ManOfTheMatch));
        Assert.That(_game.Away.ManOfTheMatch, Is.EqualTo(_game.AwaySubmission.Away.ManOfTheMatch));
        AssertCacheEviction(divisionId: null, seasonId: null);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Submission published",
            "Scores updated",
        }));
    }

    [Test]
    public async Task ApplyUpdate_WhenFailsToUpdateHomeSubmission_ReturnsUnsuccessful()
    {
        SetAccess(manageScores: false, inputResults: true);
        _game.Home.Id = Guid.Parse(UserTeamId);
        _scores.LastUpdated = new DateTime(2002, 03, 04); // something different to _game.Updated

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "Unable to update Game, EDITOR updated it before you at 3 Feb 2001 00:00:00",
        }));
        Assert.That(result.Success, Is.False);
        AssertCacheEviction(divisionId: null, seasonId: null);
    }

    [Test]
    public async Task ApplyUpdate_WhenPermittedToInputResults_UpdatesAwaySubmissionAndReturnsSuccessful()
    {
        SetAccess(manageScores: false, inputResults: true);
        _game.Away.Id = Guid.Parse(UserTeamId);
        _scores.Away!.ManOfTheMatch = AwayPlayer.Id;
        _scores.Matches.Add(AwayWinnerMatch);
        _scores.OneEighties.Add(HomePlayer);
        _scores.Over100Checkouts.Add(AwayPlayer);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Submission updated",
            "Scores updated",
        }));
        Assert.That(result.Success, Is.True);
        Assert.That(_game.AwaySubmission, Is.Not.Null);
        Assert.That(_game.AwaySubmission!.Matches[0], Is.SameAs(AdaptedGameMatch));
        Assert.That(_game.AwaySubmission!.OneEighties[0], Is.SameAs(HomeGamePlayer));
        Assert.That(_game.AwaySubmission!.Over100Checkouts[0], Is.SameAs(Over100CheckoutPlayer));
        Assert.That(_game.AwaySubmission!.Away.ManOfTheMatch, Is.EqualTo(AwayPlayer.Id));
        Assert.That(_game.Away.ManOfTheMatch, Is.Null);
        AssertCacheEviction(divisionId: null, seasonId: null);
    }

    [Test]
    public async Task ApplyUpdate_WhenUpdatingAwaySubmissionAndMatchesHomeSubmission_PublishesScores()
    {
        SetAccess(manageScores: false, inputResults: true);
        _game.Away.Id = Guid.Parse(UserTeamId);
        _game.HomeSubmission = new CosmosGame
        {
            Home = new GameTeam { ManOfTheMatch = Guid.NewGuid() },
            Matches = { new GameMatch() },
            MatchOptions = { new GameMatchOption() },
            OneEighties = { new GamePlayer() },
            Over100Checkouts = { new NotablePlayer() },
        };
        _game.AwaySubmission = new CosmosGame
        {
            Away = new GameTeam { ManOfTheMatch = Guid.NewGuid() },
            Editor = "EDITOR",
            Updated = _scores.LastUpdated!.Value,
        };
        _submissionComparer.Setup(c => c.Equals(_game.HomeSubmission, _game.AwaySubmission)).Returns(true);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_game.AwaySubmission, Is.Not.Null);
        Assert.That(_game.HomeSubmission, Is.Not.Null);
        Assert.That(_game.Matches, Is.EqualTo(_game.HomeSubmission.Matches));
        Assert.That(_game.MatchOptions, Is.EqualTo(_game.HomeSubmission.MatchOptions));
        Assert.That(_game.OneEighties, Is.EqualTo(_game.HomeSubmission.OneEighties));
        Assert.That(_game.Over100Checkouts, Is.EqualTo(_game.HomeSubmission.Over100Checkouts));
        Assert.That(_game.Home.ManOfTheMatch, Is.EqualTo(_game.HomeSubmission.Home.ManOfTheMatch));
        Assert.That(_game.Away.ManOfTheMatch, Is.EqualTo(_game.AwaySubmission.Away.ManOfTheMatch));
        AssertCacheEviction(divisionId: null, seasonId: null);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Submission published",
            "Scores updated",
        }));
    }

    [Test]
    public async Task ApplyUpdate_WhenUpdatingAwaySubmissionAndDoesNotMatchHomeSubmission_DoesNotPublishScores()
    {
        SetAccess(manageScores: false, inputResults: true);
        _game.Away.Id = Guid.Parse(UserTeamId);
        _game.HomeSubmission = new CosmosGame
        {
            Home = new GameTeam { ManOfTheMatch = Guid.NewGuid() },
            Matches = { new GameMatch() },
            MatchOptions = { new GameMatchOption() },
            OneEighties = { new GamePlayer() },
            Over100Checkouts = { new NotablePlayer() },
        };
        _game.AwaySubmission = new CosmosGame
        {
            Away = new GameTeam { ManOfTheMatch = Guid.NewGuid() },
            Editor = "EDITOR",
            Updated = _scores.LastUpdated!.Value,
        };
        _submissionComparer.Setup(c => c.Equals(_game.HomeSubmission, _game.AwaySubmission)).Returns(false);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_game.AwaySubmission, Is.Not.Null);
        Assert.That(_game.HomeSubmission, Is.Not.Null);
        AssertCacheEviction(divisionId: null, seasonId: null);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Submission updated",
            "Scores updated",
        }));
    }

    [Test]
    public async Task ApplyUpdate_WhenUpdatingAwaySubmissionAndNoHomeSubmission_DoesNotPublishScores()
    {
        SetAccess(manageScores: false, inputResults: true);
        _game.Away.Id = Guid.Parse(UserTeamId);
        _game.HomeSubmission = null;
        _game.AwaySubmission = new CosmosGame
        {
            Away = new GameTeam { ManOfTheMatch = Guid.NewGuid() },
            Editor = "EDITOR",
            Updated = _scores.LastUpdated!.Value,
        };
        _submissionComparer.Setup(c => c.Equals(_game.HomeSubmission, _game.AwaySubmission)).Returns(true);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_game.AwaySubmission, Is.Not.Null);
        Assert.That(_game.HomeSubmission, Is.Null);
        Assert.That(_game.Matches, Is.Empty);
        AssertCacheEviction(divisionId: null, seasonId: null);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Submission updated",
            "Scores updated",
        }));
    }

    [Test]
    public async Task ApplyUpdate_WhenFailsToUpdateAwaySubmission_ReturnsUnsuccessful()
    {
        SetAccess(manageScores: false, inputResults: true);
        _game.Away.Id = Guid.Parse(UserTeamId);
        _scores.LastUpdated = new DateTime(2002, 03, 04); // something different to _game.Updated

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "Unable to update Game, EDITOR updated it before you at 3 Feb 2001 00:00:00",
        }));
        Assert.That(result.Success, Is.False);
        AssertCacheEviction(divisionId: null, seasonId: null);
    }

    [Test]
    public async Task ApplyUpdate_WhenPermittedToManageGames_UpdatesGameDetailsAndReturnsSuccessful()
    {
        _game.SeasonId = SeasonDto.Id;
        _game.Date = new DateTime(2001, 02, 03);
        SetAccess(manageGames: true);
        Properties(postponed: true, isKnockout: true, address: "new address", date: new DateTime(2001, 02, 04));
        _seasonService.Setup(s => s.GetForDate(_scores.Date, _token)).ReturnsAsync(SeasonDto);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Game updated",
            "Game details updated",
            "Scores updated",
        }));
        Assert.That(_game.Address, Is.EqualTo("new address"));
        Assert.That(_game.Postponed, Is.True);
        Assert.That(_game.IsKnockout, Is.True);
        Assert.That(_game.Date, Is.EqualTo(new DateTime(2001, 02, 04)));
        Assert.That(_game.SeasonId, Is.EqualTo(SeasonDto.Id));
    }

    [Test]
    public async Task ApplyUpdate_WhenChangesSeason_UpdatesSeason()
    {
        _game.SeasonId = Guid.NewGuid(); // some other season
        SetAccess(manageGames: true);
        Properties(postponed: true, isKnockout: true, address: "new address", date: new DateTime(2001, 02, 04));
        _seasonService.Setup(s => s.GetForDate(_scores.Date, _token)).ReturnsAsync(SeasonDto);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_game.Date, Is.EqualTo(new DateTime(2001, 02, 04)));
        Assert.That(_game.SeasonId, Is.EqualTo(SeasonDto.Id));
        _teamService.Verify(c => c.Upsert(_game.Home.Id, _addSeasonToTeamCommand.Object, _token));
        _teamService.Verify(c => c.Upsert(_game.Away.Id, _addSeasonToTeamCommand.Object, _token));
        AssertCacheEviction(divisionId: _game.DivisionId, seasonId: SeasonDto.Id);
    }

    [Test]
    public async Task ApplyUpdate_WhenDateUnchanged_DoesNotChangeSeason()
    {
        var seasonId = Guid.NewGuid();
        _game.SeasonId = seasonId;
        _game.Date = new DateTime(2001, 02, 04);
        SetAccess(manageGames: true);
        Properties(postponed: true, isKnockout: true, address: "new address", date: _game.Date);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_game.Date, Is.EqualTo(new DateTime(2001, 02, 04)));
        Assert.That(_game.SeasonId, Is.EqualTo(seasonId));
        AssertCacheEviction(divisionId: _game.DivisionId, seasonId: seasonId);
    }

    [Test]
    public async Task ApplyUpdate_WhenNewSeasonCannotBeFound_DoesNotUpdateSeason()
    {
        var oldSeasonId = Guid.NewGuid(); // some other season
        _game.SeasonId = oldSeasonId;
        _game.Date = new DateTime(2003, 04, 05);
        SetAccess(manageGames: true);
        Properties(postponed: true, isKnockout: true, address: "new address", date: new DateTime(2001, 02, 04));
        _seasonService.Setup(s => s.GetForDate(_scores.Date, _token)).ReturnsAsync(() => null);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Unable to find season for date: 04 Feb 2001" }));
        Assert.That(_game.Date, Is.EqualTo(new DateTime(2001, 02, 04)));
        Assert.That(_game.SeasonId, Is.EqualTo(oldSeasonId));
        _teamService.Verify(c => c.Upsert(It.IsAny<Guid>(), _addSeasonToTeamCommand.Object, _token), Times.Never);
    }

    [Test]
    public async Task ApplyUpdate_WhenUpdateGameDetailsFails_ReturnsFailureDetail()
    {
        _teamUpdate = new ActionResultDto<TeamDto>
        {
            Success = false,
            Errors =
            {
                "error",
            },
            Warnings =
            {
                "warning",
            },
            Messages =
            {
                "message",
            },
        };
        _game.Date = new DateTime(2001, 02, 03);
        SetAccess(manageGames: true);
        Properties(postponed: true, isKnockout: true, address: "new address", date: new DateTime(2001, 02, 04));
        _seasonService.Setup(s => s.GetForDate(_scores.Date, _token)).ReturnsAsync(SeasonDto);

        var result = await _command.WithData(_scores).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "warning", "warning",
        }));
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "error", "error",
        }));
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Game updated",
            "message",
            "message",
            "Could not add season to home and/or away teams",
        }));
    }

    private void AssertCacheEviction(Guid? divisionId = null, Guid? seasonId = null)
    {
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(divisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(seasonId));
    }

    private void Properties(bool postponed = false, bool isKnockout = false, string address = "", DateTime? date = null)
    {
        _scores.Postponed = postponed;
        _scores.IsKnockout = isKnockout;
        _scores.Address = address;
        _scores.Date = date ?? default;
    }

    private void SetAccess(bool manageGames = false, bool manageScores = true, bool inputResults = false, bool recordScoresAsYouGo = false)
    {
        _user!.Access!.InputResults = inputResults;
        _user!.Access!.ManageScores = manageScores;
        _user!.Access!.ManageGames = manageGames;
        _user!.Access!.RecordScoresAsYouGo = recordScoresAsYouGo;
    }
}
