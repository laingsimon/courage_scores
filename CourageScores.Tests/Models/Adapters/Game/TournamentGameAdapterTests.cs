using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class TournamentGameAdapterTests
{
    private static readonly TournamentRound Round = new TournamentRound();
    private static readonly TournamentRoundDto RoundDto = new TournamentRoundDto();
    private static readonly TournamentSide Side = new TournamentSide();
    private static readonly TournamentSideDto SideDto = new TournamentSideDto();
    private static readonly TournamentPlayer OneEightyPlayer = new TournamentPlayer();
    private static readonly TournamentPlayerDto OneEightyPlayerDto = new TournamentPlayerDto();
    private static readonly NotableTournamentPlayer HiCheckPlayer = new NotableTournamentPlayer();
    private static readonly NotableTournamentPlayerDto HiCheckPlayerDto = new NotableTournamentPlayerDto();

    private readonly CancellationToken _token = new CancellationToken();
    private readonly TournamentGameAdapter _adapter = new TournamentGameAdapter(
        new MockAdapter<TournamentRound, TournamentRoundDto>(Round, RoundDto),
        new MockAdapter<TournamentSide, TournamentSideDto>(Side, SideDto),
        new MockAdapter<TournamentPlayer, TournamentPlayerDto>(OneEightyPlayer, OneEightyPlayerDto),
        new MockAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto>(HiCheckPlayer, HiCheckPlayerDto));

    [Test]
    public async Task Adapt_GivenModelWithRound_SetsPropertiesCorrectly()
    {
        var model = new TournamentGame
        {
            Id = Guid.NewGuid(),
            Round = Round,
            Date = new DateTime(2001, 02, 03),
            Sides = { Side },
            SeasonId = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            Address = "address",
            OneEighties = { OneEightyPlayer },
            Over100Checkouts = { HiCheckPlayer },
            Notes = "notes",
            AccoladesQualify = true,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Round, Is.EqualTo(RoundDto));
        Assert.That(result.Date, Is.EqualTo(model.Date));
        Assert.That(result.Sides, Is.EqualTo(new[] { SideDto }));
        Assert.That(result.SeasonId, Is.EqualTo(model.SeasonId));
        Assert.That(result.DivisionId, Is.EqualTo(model.DivisionId));
        Assert.That(result.Address, Is.EqualTo(model.Address));
        Assert.That(result.OneEighties, Is.EqualTo(new[] { OneEightyPlayerDto }));
        Assert.That(result.Over100Checkouts, Is.EqualTo(new[] { HiCheckPlayerDto }));
        Assert.That(result.Notes, Is.EqualTo(model.Notes));
        Assert.That(result.AccoladesQualify, Is.True);
    }

    [Test]
    public async Task Adapt_GivenModelWithoutRound_SetsPropertiesCorrectly()
    {
        var model = new TournamentGame();

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Round, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenDtoWithRound_SetsPropertiesCorrectly()
    {
        var dto = new TournamentGameDto
        {
            Id = Guid.NewGuid(),
            Round = RoundDto,
            Date = new DateTime(2001, 02, 03),
            Sides = { SideDto },
            SeasonId = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            Address = "address",
            OneEighties = { OneEightyPlayerDto },
            Over100Checkouts = { HiCheckPlayerDto },
            Notes = "notes",
            AccoladesQualify = true,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Round, Is.EqualTo(Round));
        Assert.That(result.Date, Is.EqualTo(dto.Date));
        Assert.That(result.Sides, Is.EqualTo(new[] { Side }));
        Assert.That(result.SeasonId, Is.EqualTo(dto.SeasonId));
        Assert.That(result.DivisionId, Is.EqualTo(dto.DivisionId));
        Assert.That(result.Address, Is.EqualTo(dto.Address));
        Assert.That(result.OneEighties, Is.EqualTo(new[] { OneEightyPlayer }));
        Assert.That(result.Over100Checkouts, Is.EqualTo(new[] { HiCheckPlayer }));
        Assert.That(result.Notes, Is.EqualTo(dto.Notes));
        Assert.That(result.AccoladesQualify, Is.True);
    }

    [Test]
    public async Task Adapt_GivenDtoWithoutDivisionId_SetsPropertiesCorrectly()
    {
        var dto = new TournamentGameDto
        {
            Address = "address",
            DivisionId = null,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.DivisionId, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenModelWithoutDivisionId_SetsPropertiesCorrectly()
    {
        var dto = new TournamentGame
        {
            DivisionId = null,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.DivisionId, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenDtoWithoutRound_SetsPropertiesCorrectly()
    {
        var dto = new TournamentGameDto
        {
            Address = "address",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Round, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhitespace()
    {
        var dto = new TournamentGameDto
        {
            Address = "address   ",
            Notes = "notes   ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Address, Is.EqualTo("address"));
        Assert.That(result.Notes, Is.EqualTo("notes"));
    }
}