using CourageScores.Filters;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Adapters.Game.Sayg;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using CourageScores.Tests.Models.Adapters;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateTournamentGameCommandTests
{
    private Mock<ISeasonService> _seasonService = null!;
    private IAdapter<TournamentSide, TournamentSideDto> _sideAdapter = null!;
    private IAdapter<TournamentRound, TournamentRoundDto> _roundAdapter = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private AddOrUpdateTournamentGameCommand _command = null!;
    private readonly CancellationToken _token = new();
    private readonly SeasonDto _season = new()
    {
        Id = Guid.NewGuid(),
    };
    private TournamentGame _game = null!;
    private EditTournamentGameDto _update = null!;
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?> _matchOptionAdapter = null!;
    private MockAdapter<TournamentMatch, TournamentMatchDto> _matchAdapter = null!;
    private Mock<IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>> _saygService = null!;
    private Mock<ICommandFactory> _commandFactory = null!;
    private Mock<ITournamentPlayerAdapter> _tournamentPlayerAdapter = null!;
    private Mock<INotableTournamentPlayerAdapter> _notableTournamentPlayerAdapter = null!;
    private Mock<IUpdateRecordedScoreAsYouGoDtoAdapter> _updateRecordedScoreAsYouGoDtoAdapter = null!;
    private GameMatchOption _matchOptions = null!;
    private GameMatchOptionDto _matchOptionsDto = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _matchOptions = new GameMatchOption();
        _matchOptionsDto = new GameMatchOptionDto();
        _game = new TournamentGame
        {
            Id = Guid.NewGuid(),
            Date = new DateTime(2002, 03, 04),
        };
        _update = new EditTournamentGameDto
        {
            Date = new DateTime(2001, 02, 03),
            LastUpdated = _game.Updated,
        };
        _cacheFlags = new ScopedCacheManagementFlags();

        _seasonService = new Mock<ISeasonService>();
        _tournamentPlayerAdapter = new Mock<ITournamentPlayerAdapter>();
        _sideAdapter = new TournamentSideAdapter(_tournamentPlayerAdapter.Object);
        _matchOptionAdapter = new MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?>(_matchOptions, _matchOptionsDto);
        _matchAdapter = new MockAdapter<TournamentMatch, TournamentMatchDto>();
        _roundAdapter = new TournamentRoundAdapter(
            _matchAdapter,
            _sideAdapter,
            _matchOptionAdapter);
        _auditingHelper = new Mock<IAuditingHelper>();
        _saygService = new Mock<IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>>();
        _commandFactory = new Mock<ICommandFactory>();
        _updateRecordedScoreAsYouGoDtoAdapter = new Mock<IUpdateRecordedScoreAsYouGoDtoAdapter>(MockBehavior.Strict);
        _notableTournamentPlayerAdapter = new Mock<INotableTournamentPlayerAdapter>();

        _command = new AddOrUpdateTournamentGameCommand(
            _seasonService.Object,
            _sideAdapter,
            _roundAdapter,
            _auditingHelper.Object,
            _cacheFlags,
            _saygService.Object,
            _commandFactory.Object,
            _updateRecordedScoreAsYouGoDtoAdapter.Object,
            _tournamentPlayerAdapter.Object,
            _notableTournamentPlayerAdapter.Object);

        _tournamentPlayerAdapter
            .Setup(a => a.Adapt(It.IsAny<TournamentPlayerDto>(), _token))
            .ReturnsAsync((TournamentPlayerDto player, CancellationToken _) => new TournamentPlayer
            {
                Id = player.Id,
                Name = player.Name,
            });
    }

    [Test]
    public async Task ApplyUpdates_WhenNoLatestSeason_ReturnsUnsuccessful()
    {
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(() => null);

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "Unable to add or update game, no season exists",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdates_WhenLatestSeason_UpdatesSimpleProperties()
    {
        var oneEightyPlayerDto = new EditTournamentGameDto.RecordTournamentScoresPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "player",
        };
        var over100CheckoutPlayerDto = new EditTournamentGameDto.TournamentOver100CheckoutDto
        {
            Id = Guid.NewGuid(),
            Name = "player",
            Notes = "120",
        };
        var oneEightyPlayer = new TournamentPlayer
        {
            Id = oneEightyPlayerDto.Id,
        };
        var over100CheckoutPlayer = new NotableTournamentPlayer
        {
            Id = over100CheckoutPlayerDto.Id,
        };
        _update.Address = "new address";
        _update.Date = new DateTime(2001, 02, 03);
        _update.Notes = "notes";
        _update.AccoladesCount = true;
        _update.BestOf = 7;
        _update.SingleRound = true;
        _update.Host = "host";
        _update.Opponent = "opponent";
        _update.Gender = "gender";
        _update.OneEighties.Add(oneEightyPlayerDto);
        _update.Over100Checkouts.Add(over100CheckoutPlayerDto);
        _update.DivisionId = Guid.NewGuid();
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(_season);
        _tournamentPlayerAdapter.Setup(a => a.Adapt(oneEightyPlayerDto, _token)).ReturnsAsync(oneEightyPlayer);
        _notableTournamentPlayerAdapter.Setup(a => a.Adapt(over100CheckoutPlayerDto, _token)).ReturnsAsync(over100CheckoutPlayer);

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Address, Is.EqualTo(_update.Address));
        Assert.That(result.Result!.Notes, Is.EqualTo(_update.Notes));
        Assert.That(result.Result!.Date, Is.EqualTo(new DateTime(2001, 02, 03)));
        Assert.That(result.Result!.OneEighties, Is.EquivalentTo(new[]
        {
            oneEightyPlayer,
        }));
        Assert.That(result.Result!.Over100Checkouts, Is.EquivalentTo(new[]
        {
            over100CheckoutPlayer,
        }));
        Assert.That(result.Result!.AccoladesCount, Is.True);
        Assert.That(result.Result!.DivisionId, Is.EqualTo(_update.DivisionId));
        Assert.That(result.Result!.BestOf, Is.EqualTo(7));
        Assert.That(result.Result!.SingleRound, Is.True);
        Assert.That(result.Result!.Host, Is.EqualTo("host"));
        Assert.That(result.Result!.Opponent, Is.EqualTo("opponent"));
        Assert.That(result.Result!.Gender, Is.EqualTo("gender"));
    }

    [Test]
    public async Task ApplyUpdates_WhenGivenTrailingWhitespace_TrimsWhitespace()
    {
        var oneEightyPlayerDto = new EditTournamentGameDto.RecordTournamentScoresPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "player",
        };
        var over100CheckoutPlayerDto = new EditTournamentGameDto.TournamentOver100CheckoutDto
        {
            Id = Guid.NewGuid(),
            Name = "player",
            Notes = "120",
        };
        var oneEightyPlayer = new TournamentPlayer
        {
            Id = oneEightyPlayerDto.Id,
        };
        var over100CheckoutPlayer = new NotableTournamentPlayer
        {
            Id = over100CheckoutPlayerDto.Id,
        };
        _update.Address = "new address   ";
        _update.Date = new DateTime(2001, 02, 03);
        _update.Notes = "notes   ";
        _update.Host = "host   ";
        _update.Opponent = "opponent   ";
        _update.Gender = "gender   ";
        _update.Type = "type   ";
        _update.OneEighties.Add(oneEightyPlayerDto);
        _update.Over100Checkouts.Add(over100CheckoutPlayerDto);
        _update.DivisionId = Guid.NewGuid();
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(_season);
        _tournamentPlayerAdapter.Setup(a => a.Adapt(oneEightyPlayerDto, _token)).ReturnsAsync(oneEightyPlayer);
        _notableTournamentPlayerAdapter.Setup(a => a.Adapt(over100CheckoutPlayerDto, _token)).ReturnsAsync(over100CheckoutPlayer);

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Address, Is.EqualTo("new address"));
        Assert.That(result.Result!.Notes, Is.EqualTo("notes"));
        Assert.That(result.Result!.Host, Is.EqualTo("host"));
        Assert.That(result.Result!.Opponent, Is.EqualTo("opponent"));
        Assert.That(result.Result!.Gender, Is.EqualTo("gender"));
        Assert.That(result.Result!.Type, Is.EqualTo("type"));
    }

    [Test]
    public async Task ApplyUpdates_WhenLatestSeasonAndNullRound_UpdatesSides()
    {
        _update.Round = null;
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(_season);

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Round, Is.Null);
    }

    [Test]
    public async Task ApplyUpdates_WhenAssignedToADivision_EvictsCacheForDivision()
    {
        _update.Round = null;
        _update.DivisionId = Guid.NewGuid();
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(_season);
        _game.DivisionId = _update.DivisionId;

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Round, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_update.DivisionId));
    }

    [Test]
    public async Task ApplyUpdates_WhenChangingDivisions_EvictsCacheForAllDivisions()
    {
        _update.Round = null;
        _update.DivisionId = Guid.NewGuid();
        _game.DivisionId = Guid.NewGuid();
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(_season);

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Round, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(ScopedCacheManagementFlags.EvictAll));
    }

    [Test]
    public async Task ApplyUpdates_WhenLatestSeason_UpdatesSides()
    {
        var side = new TournamentSideDto
        {
            Name = "Side name",
            Players =
            {
                new TournamentPlayerDto
                {
                    Id = Guid.NewGuid(),
                    Name = "Player name",
                    DivisionId = Guid.NewGuid(),
                },
            },
        };
        _update.Sides.Add(side);
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(_season);

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Sides.Count, Is.EqualTo(1));
        Assert.That(result.Result!.Sides[0].Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(result.Result!.Sides[0].Players.Count, Is.EqualTo(1));
    }

    [Test]
    public async Task ApplyUpdates_WhenLatestSeason_UpdatesRoundRecursively()
    {
        var side1Player1 = new TournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Side1, Player 1",
        };
        var side1Player2 = new TournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Side1, Player 2",
        };
        var side2Player1 = new TournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Side2, Player 1",
        };
        var side2Player2 = new TournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Side2, Player 2",
        };
        var side1 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 1",
            Players =
            {
                side1Player1,
                side1Player2,
            },
        };
        var side2 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 2",
            Players =
            {
                side2Player1,
                side2Player2,
            },
        };
        var secondRound = new TournamentRoundDto
        {
            Sides =
            {
                new TournamentSideDto
                {
                    Players =
                    {
                        side1Player2,
                        side1Player1,
                    },
                },
            },
            Matches =
            {
                new TournamentMatchDto
                {
                    SideA = side1,
                    SideB = side2,
                },
                new TournamentMatchDto
                {
                    SideA = side1,
                    SideB = side2,
                },
            },
        };
        var rootRound = new TournamentRoundDto
        {
            NextRound = secondRound,
            Sides =
            {
                new TournamentSideDto
                {
                    Players =
                    {
                        side1Player2,
                        side1Player1,
                    },
                },
                new TournamentSideDto
                {
                    Players =
                    {
                        side2Player2,
                        side2Player1,
                    },
                },
            },
            Matches =
            {
                new TournamentMatchDto
                {
                    SideA = side1,
                    SideB = side2,
                },
            },
        };
        _update.Round = rootRound;
        _update.Sides = new List<TournamentSideDto>(new[]
        {
            side1, side2,
        });
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(_season);
        rootRound.Matches.ForEach(matchDto => _matchAdapter.AddMapping(new TournamentMatch(), matchDto));
        secondRound.Matches.ForEach(matchDto => _matchAdapter.AddMapping(new TournamentMatch(), matchDto));

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Round!.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(result.Result!.Round!.Matches.Count, Is.EqualTo(1));
        Assert.That(result.Result!.Round!.Matches.Select(m => m.Id), Has.All.Not.EqualTo(Guid.Empty));
        Assert.That(result.Result!.Round!.Sides.Select(s => s.Id), Is.EquivalentTo(new[]
        {
            side1.Id, side2.Id,
        }));
        Assert.That(result.Result!.Round!.NextRound!.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(result.Result!.Round!.NextRound.Matches.Count, Is.EqualTo(2));
        Assert.That(result.Result!.Round!.NextRound.Matches.Select(m => m.Id), Has.All.Not.EqualTo(Guid.Empty));
        Assert.That(result.Result!.Round!.NextRound.Sides.Select(s => s.Id), Is.EquivalentTo(new[]
        {
            side1.Id,
        }));
    }

    [Test]
    public async Task ApplyUpdates_WhenSaygNotFoundForMatch_RemovesIdAndWarns()
    {
        var side1Player1 = new TournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Side1, Player 1",
        };
        var side2Player1 = new TournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Side2, Player 1",
        };
        var side1 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 1",
            Players =
            {
                side1Player1,
            },
        };
        var side2 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 2",
            Players =
            {
                side2Player1,
            },
        };
        var saygId = Guid.NewGuid();
        var rootRound = new TournamentRoundDto
        {
            Sides =
            {
                new TournamentSideDto
                {
                    Players =
                    {
                        side1Player1,
                    },
                },
                new TournamentSideDto
                {
                    Players =
                    {
                        side2Player1,
                    },
                },
            },
            Matches =
            {
                new TournamentMatchDto
                {
                    SideA = side1,
                    SideB = side2,
                    SaygId = saygId,
                },
            },
        };
        _update.Round = rootRound;
        _update.Sides = new List<TournamentSideDto>(new[]
        {
            side1, side2,
        });
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(_season);
        rootRound.Matches.ForEach(matchDto => _matchAdapter.AddMapping(new TournamentMatch
        {
            SideA = new TournamentSide
            {
                Name = side1.Name,
            },
            SideB = new TournamentSide
            {
                Name = side2.Name,
            },
            SaygId = matchDto.SaygId,
        }, matchDto));
        _saygService.Setup(s => s.Get(saygId, _token)).ReturnsAsync(() => null);

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_game.Round!.Matches[0].SaygId, Is.Null);
        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            $"Could not find sayg session for match: Side 1 vs Side 2, session has been removed and will need to be re-created (was {saygId})",
        }));
    }

    [Test]
    public async Task ApplyUpdates_WhenSaygExistsFoundForMatch_UpdatesSaygSession()
    {
        var side1Player1 = new TournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Side1, Player 1",
        };
        var side2Player1 = new TournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Side2, Player 1",
        };
        var side1 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 1",
            Players =
            {
                side1Player1,
            },
        };
        var side2 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 2",
            Players =
            {
                side2Player1,
            },
        };
        var command = new Mock<AddOrUpdateSaygCommand>(MockBehavior.Strict, new Mock<ISimpleAdapter<Leg, LegDto>>().Object, new Mock<IUserService>().Object);
        var saygUpdate = new UpdateRecordedScoreAsYouGoDto();
        var sayg = new RecordedScoreAsYouGoDto
        {
            Id = Guid.NewGuid(),
        };
        var rootRound = new TournamentRoundDto
        {
            Sides =
            {
                new TournamentSideDto
                {
                    Players =
                    {
                        side1Player1,
                    },
                },
                new TournamentSideDto
                {
                    Players =
                    {
                        side2Player1,
                    },
                },
            },
            Matches =
            {
                new TournamentMatchDto
                {
                    SideA = side1,
                    SideB = side2,
                    SaygId = sayg.Id,
                },
            },
        };
        var newMatch = new TournamentMatch
        {
            SideA = new TournamentSide
            {
                Name = side1.Name,
            },
            SideB = new TournamentSide
            {
                Name = side2.Name,
            },
            SaygId = sayg.Id,
        };
        _update.Round = rootRound;
        _update.Sides = new List<TournamentSideDto>(new[]
        {
            side1, side2,
        });
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(_season);
        rootRound.Matches.ForEach(matchDto => _matchAdapter.AddMapping(newMatch, matchDto));
        _saygService.Setup(s => s.Get(sayg.Id, _token)).ReturnsAsync(() => sayg);
        _commandFactory.Setup(f => f.GetCommand<AddOrUpdateSaygCommand>()).Returns(command.Object);
        _updateRecordedScoreAsYouGoDtoAdapter
            .Setup(a => a.Adapt(It.IsAny<RecordedScoreAsYouGoDto>(), newMatch, null, _token))
            .ReturnsAsync(saygUpdate);
        command.Setup(c => c.WithData(saygUpdate)).Returns(command.Object);
        _saygService
            .Setup(s => s.Upsert(sayg.Id, command.Object, _token))
            .ReturnsAsync(() => new ActionResultDto<RecordedScoreAsYouGoDto>());

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_game.Round!.Matches[0].SaygId, Is.EqualTo(sayg.Id));
    }

    [Test]
    public async Task ApplyUpdates_WhenSaygExistsFoundForMatchWithMatchOptions_UpdatesSaygSession()
    {
        var side1Player1 = new TournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Side1, Player 1",
        };
        var side2Player1 = new TournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Side2, Player 1",
        };
        var side1 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 1",
            Players =
            {
                side1Player1,
            },
        };
        var side2 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 2",
            Players =
            {
                side2Player1,
            },
        };
        var command = new Mock<AddOrUpdateSaygCommand>(MockBehavior.Strict, new Mock<ISimpleAdapter<Leg, LegDto>>().Object, new Mock<IUserService>().Object);
        var saygUpdate = new UpdateRecordedScoreAsYouGoDto();
        var sayg = new RecordedScoreAsYouGoDto
        {
            Id = Guid.NewGuid(),
        };
        var rootRound = new TournamentRoundDto
        {
            Sides =
            {
                new TournamentSideDto
                {
                    Players =
                    {
                        side1Player1,
                    },
                },
                new TournamentSideDto
                {
                    Players =
                    {
                        side2Player1,
                    },
                },
            },
            Matches =
            {
                new TournamentMatchDto
                {
                    SideA = side1,
                    SideB = side2,
                    SaygId = sayg.Id,
                },
            },
            MatchOptions =
            {
                _matchOptionsDto,
            },
        };
        var newMatch = new TournamentMatch
        {
            SideA = new TournamentSide
            {
                Name = side1.Name,
            },
            SideB = new TournamentSide
            {
                Name = side2.Name,
            },
            SaygId = sayg.Id,
        };
        _update.Round = rootRound;
        _update.Sides = new List<TournamentSideDto>(new[]
        {
            side1, side2,
        });
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(_season);
        rootRound.Matches.ForEach(matchDto => _matchAdapter.AddMapping(newMatch, matchDto));
        _saygService.Setup(s => s.Get(sayg.Id, _token)).ReturnsAsync(() => sayg);
        _commandFactory.Setup(f => f.GetCommand<AddOrUpdateSaygCommand>()).Returns(command.Object);
        _updateRecordedScoreAsYouGoDtoAdapter
            .Setup(a => a.Adapt(It.IsAny<RecordedScoreAsYouGoDto>(), newMatch, _matchOptions, _token))
            .ReturnsAsync(saygUpdate);
        command.Setup(c => c.WithData(saygUpdate)).Returns(command.Object);
        _saygService
            .Setup(s => s.Upsert(sayg.Id, command.Object, _token))
            .ReturnsAsync(() => new ActionResultDto<RecordedScoreAsYouGoDto>());
        _game.Round = new TournamentRound
        {
            MatchOptions =
            {
                _matchOptions,
            },
        };

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_game.Round!.Matches[0].SaygId, Is.EqualTo(sayg.Id));
    }
}