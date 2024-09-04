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
using CourageScores.Tests.Models.Cosmos.Game;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateTournamentGameCommandTests
{
    private static readonly TournamentPlayerDto OneEightyPlayerDto = TournamentPlayerDto("player");
    private static readonly NotableTournamentPlayerDto Over100CheckoutPlayerDto = new NotableTournamentPlayerDto
    {
        Id = Guid.NewGuid(),
        Name = "player",
        Score = 120,
    };
    private static readonly TournamentPlayer OneEightyPlayer = new TournamentPlayer
    {
        Id = OneEightyPlayerDto.Id,
    };
    private static readonly NotableTournamentPlayer Over100CheckoutPlayer = new NotableTournamentPlayer
    {
        Id = Over100CheckoutPlayerDto.Id,
    };
    private static readonly TournamentPlayerDto Side1Player1 = TournamentPlayerDto("Side1, Player 1");
    private static readonly TournamentPlayerDto Side1Player2 = TournamentPlayerDto("Side1, Player 2");
    private static readonly TournamentPlayerDto Side2Player1 = TournamentPlayerDto("Side2, Player 1");
    private static readonly TournamentPlayerDto Side2Player2 = TournamentPlayerDto("Side2, Player 2");
    private static readonly TournamentSideDto Side1NoId = new TournamentSideDto
    {
        Name = "Side 1",
        Players = { Side1Player1 },
    };
    private static readonly TournamentSideDto Side2 = new TournamentSideDto
    {
        Id = Guid.NewGuid(),
        Name = "Side 2",
        Players = { Side2Player1 },
    };

    private Mock<ICachingSeasonService> _seasonService = null!;
    private IAdapter<TournamentSide, TournamentSideDto> _sideAdapter = null!;
    private IAdapter<TournamentRound, TournamentRoundDto> _roundAdapter = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private AddOrUpdateTournamentGameCommand _command = null!;
    private readonly CancellationToken _token = new();
    private readonly SeasonDto _season = new SeasonDtoBuilder().Build();
    private TournamentGame _game = null!;
    private EditTournamentGameDto _update = null!;
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?> _matchOptionAdapter = null!;
    private MockAdapter<TournamentMatch, TournamentMatchDto> _matchAdapter = null!;
    private Mock<IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>> _saygService = null!;
    private Mock<ICommandFactory> _commandFactory = null!;
    private Mock<IAdapter<TournamentPlayer, TournamentPlayerDto>> _tournamentPlayerAdapter = null!;
    private Mock<IAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto>> _notableTournamentPlayerAdapter = null!;
    private Mock<IUpdateRecordedScoreAsYouGoDtoAdapter> _updateRecordedScoreAsYouGoDtoAdapter = null!;
    private GameMatchOption _matchOptions = null!;
    private GameMatchOptionDto _matchOptionsDto = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _matchOptions = new GameMatchOption();
        _matchOptionsDto = new GameMatchOptionDto();
        _game = new TournamentGameBuilder().WithDate(new DateTime(2002, 03, 04)).Build();
        _update = new EditTournamentGameDto
        {
            Date = new DateTime(2001, 02, 03),
            SeasonId = _season.Id,
            LastUpdated = _game.Updated,
        };
        _cacheFlags = new ScopedCacheManagementFlags();
        _seasonService = new Mock<ICachingSeasonService>();
        _tournamentPlayerAdapter = new Mock<IAdapter<TournamentPlayer, TournamentPlayerDto>>();
        _sideAdapter = new TournamentSideAdapter(_tournamentPlayerAdapter.Object);
        _matchOptionAdapter = new MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?>(_matchOptions, _matchOptionsDto);
        _matchAdapter = new MockAdapter<TournamentMatch, TournamentMatchDto>();
        _roundAdapter = new TournamentRoundAdapter(_matchAdapter, _sideAdapter, _matchOptionAdapter);
        _auditingHelper = new Mock<IAuditingHelper>();
        _saygService = new Mock<IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>>();
        _commandFactory = new Mock<ICommandFactory>();
        _updateRecordedScoreAsYouGoDtoAdapter = new Mock<IUpdateRecordedScoreAsYouGoDtoAdapter>(MockBehavior.Strict);
        _notableTournamentPlayerAdapter = new Mock<IAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto>>();

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

        _seasonService.Setup(s => s.Get(_update.SeasonId, _token)).ReturnsAsync(() => _season);
        _tournamentPlayerAdapter.Setup(a => a.Adapt(OneEightyPlayerDto, _token)).ReturnsAsync(OneEightyPlayer);
        _notableTournamentPlayerAdapter.Setup(a => a.Adapt(Over100CheckoutPlayerDto, _token)).ReturnsAsync(Over100CheckoutPlayer);
    }

    [Test]
    public async Task ApplyUpdates_WhenNoLatestSeason_ReturnsUnsuccessful()
    {
        _seasonService.Setup(s => s.Get(_update.SeasonId, _token)).ReturnsAsync(() => null);

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Season not found" }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdates_WhenLatestSeason_UpdatesSimpleProperties()
    {
        _update.Address = "new address";
        _update.Date = new DateTime(2001, 02, 03);
        _update.Notes = "notes";
        _update.AccoladesCount = true;
        _update.ExcludeFromReports = true;
        _update.BestOf = 7;
        _update.SingleRound = true;
        _update.Host = "host";
        _update.Opponent = "opponent";
        _update.Gender = "gender";
        _update.OneEighties.Add(OneEightyPlayerDto);
        _update.Over100Checkouts.Add(Over100CheckoutPlayerDto);
        _update.DivisionId = Guid.NewGuid();

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Address, Is.EqualTo(_update.Address));
        Assert.That(result.Result!.Notes, Is.EqualTo(_update.Notes));
        Assert.That(result.Result!.Date, Is.EqualTo(new DateTime(2001, 02, 03)));
        Assert.That(result.Result!.OneEighties, Is.EquivalentTo(new[] { OneEightyPlayer }));
        Assert.That(result.Result!.Over100Checkouts, Is.EquivalentTo(new[] { Over100CheckoutPlayer }));
        Assert.That(result.Result!.AccoladesCount, Is.True);
        Assert.That(result.Result!.ExcludeFromReports, Is.True);
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
        _update.Address = "new address   ";
        _update.Date = new DateTime(2001, 02, 03);
        _update.Notes = "notes   ";
        _update.Host = "host   ";
        _update.Opponent = "opponent   ";
        _update.Gender = "gender   ";
        _update.Type = "type   ";
        _update.OneEighties.Add(OneEightyPlayerDto);
        _update.Over100Checkouts.Add(Over100CheckoutPlayerDto);
        _update.DivisionId = Guid.NewGuid();

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

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Round, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(ScopedCacheManagementFlags.EvictAll));
    }

    [Test]
    public async Task ApplyUpdates_WhenLatestSeason_UpdatesSides()
    {
        _update.Sides.Add(Side1NoId);

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Sides.Count, Is.EqualTo(1));
        Assert.That(result.Result!.Sides[0].Id, Is.Not.EqualTo(Guid.Empty).And.Not.EqualTo(Side1NoId.Id));
        Assert.That(result.Result!.Sides[0].Players.Count, Is.EqualTo(1));
    }

    [Test]
    public async Task ApplyUpdates_WhenLatestSeason_UpdatesRoundRecursively()
    {
        var side1 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 1",
            Players = { Side1Player1, Side1Player2 },
        };
        var side2 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 2",
            Players = { Side2Player1, Side2Player2 },
        };
        var secondRound = new TournamentRoundDto
        {
            Sides = { side1 },
            Matches = { MatchDto(side1, side2), MatchDto(side1, side2) },
        };
        var rootRound = new TournamentRoundDto
        {
            NextRound = secondRound,
            Sides = { side1, side2 },
            Matches = { MatchDto(side1, side2) },
        };
        _update.Round = rootRound;
        _update.Sides = new List<TournamentSideDto>(new[] { side1, side2 });
        rootRound.Matches.ForEach(matchDto => _matchAdapter.AddMapping(new TournamentMatch(), matchDto));
        secondRound.Matches.ForEach(matchDto => _matchAdapter.AddMapping(new TournamentMatch(), matchDto));

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Round!.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(result.Result!.Round!.Matches.Count, Is.EqualTo(1));
        Assert.That(result.Result!.Round!.Matches.Select(m => m.Id), Has.All.Not.EqualTo(Guid.Empty));
        Assert.That(result.Result!.Round!.Sides.Select(s => s.Id), Is.EquivalentTo(new[] { side1.Id, side2.Id }));
        Assert.That(result.Result!.Round!.NextRound!.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(result.Result!.Round!.NextRound.Matches.Count, Is.EqualTo(2));
        Assert.That(result.Result!.Round!.NextRound.Matches.Select(m => m.Id), Has.All.Not.EqualTo(Guid.Empty));
        Assert.That(result.Result!.Round!.NextRound.Sides.Select(s => s.Id), Is.EquivalentTo(new[] { side1.Id }));
    }

    [Test]
    public async Task ApplyUpdates_WhenSaygNotFoundForMatch_RemovesIdAndWarns()
    {
        var saygId = Guid.NewGuid();
        var rootRound = new TournamentRoundDto
        {
            Sides = { Side1NoId, Side2 },
            Matches = { MatchDto(Side1NoId, Side2, saygId) },
        };
        _update.Round = rootRound;
        _update.Sides = new List<TournamentSideDto>(new[] { Side1NoId, Side2 });
        rootRound.Matches.ForEach(matchDto => _matchAdapter.AddMapping(Match(Side1NoId, Side2, matchDto.SaygId), matchDto));
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
        var command = new Mock<AddOrUpdateSaygCommand>(MockBehavior.Strict, new Mock<ISimpleAdapter<Leg, LegDto>>().Object, new Mock<IUserService>().Object);
        var saygUpdate = new UpdateRecordedScoreAsYouGoDto();
        var sayg = new RecordedScoreAsYouGoDto
        {
            Id = Guid.NewGuid(),
        };
        var rootRound = new TournamentRoundDto
        {
            Sides = { Side1NoId, Side2 },
            Matches = { MatchDto(Side1NoId, Side2, sayg.Id) },
        };
        var newMatch = Match(Side1NoId, Side2, sayg.Id);
        _update.Round = rootRound;
        _update.Sides = new List<TournamentSideDto>(new[] { Side1NoId, Side2 });
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
        var command = new Mock<AddOrUpdateSaygCommand>(MockBehavior.Strict, new Mock<ISimpleAdapter<Leg, LegDto>>().Object, new Mock<IUserService>().Object);
        var saygUpdate = new UpdateRecordedScoreAsYouGoDto();
        var sayg = new RecordedScoreAsYouGoDto
        {
            Id = Guid.NewGuid(),
        };
        var rootRound = new TournamentRoundDto
        {
            Sides = { Side1NoId, Side2 },
            Matches = { MatchDto(Side1NoId, Side2, sayg.Id) },
            MatchOptions = { _matchOptionsDto },
        };
        var newMatch = Match(Side1NoId, Side2, sayg.Id);
        _update.Round = rootRound;
        _update.Sides = new List<TournamentSideDto>(new[] { Side1NoId, Side2 });
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
            MatchOptions = { _matchOptions },
        };

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_game.Round!.Matches[0].SaygId, Is.EqualTo(sayg.Id));
    }

    private static TournamentMatchDto MatchDto(TournamentSideDto sideA, TournamentSideDto sideB, Guid? saygId = null)
    {
        return new TournamentMatchDto
        {
            SideA = sideA,
            SideB = sideB,
            SaygId = saygId,
        };
    }

    private static TournamentMatch Match(TournamentSideDto sideA, TournamentSideDto sideB, Guid? saygId = null)
    {
        return new TournamentMatch
        {
            SideA = new TournamentSide
            {
                Name = sideA.Name!,
            },
            SideB = new TournamentSide
            {
                Name = sideB.Name!,
            },
            SaygId = saygId,
        };
    }

    private static TournamentPlayerDto TournamentPlayerDto(string name)
    {
        return new TournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = name,
        };
    }
}