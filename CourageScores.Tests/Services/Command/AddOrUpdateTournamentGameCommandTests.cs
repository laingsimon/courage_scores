using CourageScores.Filters;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using CourageScores.Tests.Models.Adapters;
using Microsoft.AspNetCore.Authentication;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateTournamentGameCommandTests
{
    private Mock<ISeasonService> _seasonService = null!;
    private IAdapter<TournamentSide,TournamentSideDto> _sideAdapter = null!;
    private IAdapter<TournamentRound,TournamentRoundDto> _roundAdapter = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private Mock<ISystemClock> _systemClock = null!;
    private Mock<IUserService> _userService = null!;
    private AddOrUpdateTournamentGameCommand _command = null!;
    private readonly CancellationToken _token = new CancellationToken();
    private readonly UserDto _user = new UserDto();
    private readonly SeasonDto _season = new SeasonDto { Id = Guid.NewGuid() };
    private TournamentGame _game = null!;
    private EditTournamentGameDto _update = null!;
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?> _matchOptionAdapter = null!;
    private MockAdapter<TournamentMatch,TournamentMatchDto> _matchAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
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
        _sideAdapter = new TournamentSideAdapter(new TournamentPlayerAdapter());
        _matchOptionAdapter = new MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?>(null, null);
        _userService = new Mock<IUserService>();
        _matchAdapter = new MockAdapter<TournamentMatch, TournamentMatchDto>();
        _roundAdapter = new TournamentRoundAdapter(
            _matchAdapter,
            _sideAdapter,
            _matchOptionAdapter);
        _auditingHelper = new Mock<IAuditingHelper>();
        _systemClock = new Mock<ISystemClock>();

        _command = new AddOrUpdateTournamentGameCommand(_seasonService.Object, _sideAdapter, _roundAdapter, _auditingHelper.Object,
            _systemClock.Object, _userService.Object, _cacheFlags);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(_user);
    }

    [Test]
    public async Task ApplyUpdates_WhenNoLatestSeason_ReturnsUnsuccessful()
    {
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(() => null);

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Unable to add or update game, no season exists"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdates_WhenLatestSeason_UpdatesSimpleProperties()
    {
        var oneEightyPlayerId = Guid.NewGuid();
        var over100CheckoutPlayerId = Guid.NewGuid();

        _update.Address = "new address";
        _update.Date = new DateTime(2001, 02, 03);
        _update.Notes = "notes";
        _update.AccoladesCount = true;
        _update.OneEighties.Add(new EditTournamentGameDto.RecordTournamentScoresPlayerDto { Id = oneEightyPlayerId, Name = "player" });
        _update.Over100Checkouts.Add(new EditTournamentGameDto.TournamentOver100CheckoutDto { Id = over100CheckoutPlayerId, Name = "player", Notes = "120" });
        _update.DivisionId = Guid.NewGuid();
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(_season);

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Address, Is.EqualTo(_update.Address));
        Assert.That(result.Result!.Notes, Is.EqualTo(_update.Notes));
        Assert.That(result.Result!.Date, Is.EqualTo(new DateTime(2001, 02, 03)));
        Assert.That(result.Result!.OneEighties.Select(p => p.Id), Is.EqualTo(new[] { oneEightyPlayerId }));
        Assert.That(result.Result!.Over100Checkouts.Select(p => p.Id), Is.EqualTo(new[] { over100CheckoutPlayerId }));
        Assert.That(result.Result!.AccoladesCount, Is.True);
        Assert.That(result.Result!.DivisionId, Is.EqualTo(_update.DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_update.DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
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
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
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
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
    }

    [Test]
    public async Task ApplyUpdates_WhenLatestSeason_UpdatesRoundRecursively()
    {
        var side1Player1 = new TournamentPlayerDto { Id = Guid.NewGuid(), Name = "Side1, Player 1" };
        var side1Player2 = new TournamentPlayerDto { Id = Guid.NewGuid(), Name = "Side1, Player 2" };
        var side2Player1 = new TournamentPlayerDto { Id = Guid.NewGuid(), Name = "Side2, Player 1" };
        var side2Player2 = new TournamentPlayerDto { Id = Guid.NewGuid(), Name = "Side2, Player 2" };
        var side1 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 1",
            Players = { side1Player1, side1Player2 },
        };
        var side2 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 2",
            Players = { side2Player1, side2Player2 },
        };
        var secondRound = new TournamentRoundDto
        {
            Sides =
            {
                new TournamentSideDto { Players = { side1Player2, side1Player1 } },
            },
            Matches =
            {
                new TournamentMatchDto { SideA = side1, SideB = side2 },
                new TournamentMatchDto { SideA = side1, SideB = side2 },
            }
        };
        var rootRound = new TournamentRoundDto
        {
            NextRound = secondRound,
            Sides =
            {
                new TournamentSideDto { Players = { side1Player2, side1Player1 } },
                new TournamentSideDto { Players = { side2Player2, side2Player1 } },
            },
            Matches =
            {
                new TournamentMatchDto { SideA = side1, SideB = side2 },
            }
        };
        _update.Round = rootRound;
        _update.Sides = new List<TournamentSideDto>(new[] { side1, side2 });
        _seasonService.Setup(s => s.GetForDate(_update.Date, _token)).ReturnsAsync(_season);
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
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
    }
}