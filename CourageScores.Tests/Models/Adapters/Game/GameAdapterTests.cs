using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class GameAdapterTests
{
    private static readonly GameMatch GameMatch = new GameMatch();
    private static readonly GameMatchDto GameMatchDto = new GameMatchDto();
    private static readonly GameTeam HomeTeam = new GameTeam();
    private static readonly GameTeamDto HomeTeamDto = new GameTeamDto();
    private static readonly GameTeam AwayTeam = new GameTeam();
    private static readonly GameTeamDto AwayTeamDto = new GameTeamDto();
    private readonly CancellationToken _token = new CancellationToken();
    private readonly GameAdapter _adapter = new GameAdapter(
        new MockAdapter<GameMatch, GameMatchDto>(GameMatch, GameMatchDto),
        new MockAdapter<GameTeam, GameTeamDto>(
            new[] { HomeTeam, AwayTeam },
            new[] { HomeTeamDto, AwayTeamDto }));

    [Test]
    public async Task Adapt_GivenUnpublishedModel_SetPropertiesCorrectly()
    {
        var model = new CourageScores.Models.Cosmos.Game.Game
        {
            Address = "address",
            Away = AwayTeam,
            Date = new DateTime(2001, 02, 03),
            Home = HomeTeam,
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            Postponed = true,
            IsKnockout = true,
            HomeSubmission = new CourageScores.Models.Cosmos.Game.Game(),
            AwaySubmission = new CourageScores.Models.Cosmos.Game.Game(),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Address, Is.EqualTo(model.Address));
        Assert.That(result.Date, Is.EqualTo(model.Date));
        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.DivisionId, Is.EqualTo(model.DivisionId));
        Assert.That(result.SeasonId, Is.EqualTo(model.SeasonId));
        Assert.That(result.Postponed, Is.EqualTo(model.Postponed));
        Assert.That(result.IsKnockout, Is.EqualTo(model.IsKnockout));
        Assert.That(result.Home, Is.SameAs(HomeTeamDto));
        Assert.That(result.Away, Is.SameAs(AwayTeamDto));
        Assert.That(result.HomeSubmission, Is.Not.Null);
        Assert.That(result.AwaySubmission, Is.Not.Null);
    }

    [Test]
    public async Task Adapt_GivenPublishedModel_SetPropertiesCorrectly()
    {
        var model = new CourageScores.Models.Cosmos.Game.Game
        {
            Matches = { GameMatch },
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Matches, Is.EqualTo(new[] { GameMatchDto }));
        Assert.That(result.HomeSubmission, Is.Null);
        Assert.That(result.AwaySubmission, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenDto_SetPropertiesCorrectly()
    {
        var dto = new GameDto
        {
            Address = "address",
            Away = AwayTeamDto,
            Date = new DateTime(2001, 02, 03),
            Home = HomeTeamDto,
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            Postponed = true,
            IsKnockout = true,
            HomeSubmission = new GameDto { Address = "address" },
            AwaySubmission = new GameDto { Address = "address" },
            Matches = { GameMatchDto }
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Address, Is.EqualTo(dto.Address));
        Assert.That(result.Date, Is.EqualTo(dto.Date));
        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.DivisionId, Is.EqualTo(dto.DivisionId));
        Assert.That(result.SeasonId, Is.EqualTo(dto.SeasonId));
        Assert.That(result.Postponed, Is.EqualTo(dto.Postponed));
        Assert.That(result.IsKnockout, Is.EqualTo(dto.IsKnockout));
        Assert.That(result.Home, Is.SameAs(HomeTeam));
        Assert.That(result.Away, Is.SameAs(AwayTeam));
        Assert.That(result.Matches, Is.EqualTo(new[] { GameMatch }));
        Assert.That(result.HomeSubmission, Is.Not.Null);
        Assert.That(result.AwaySubmission, Is.Not.Null);
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhiteSpace()
    {
        var dto = new GameDto
        {
            Address = "address   ",
            Away = AwayTeamDto,
            Date = new DateTime(2001, 02, 03),
            Home = HomeTeamDto,
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            Postponed = true,
            IsKnockout = true,
            HomeSubmission = new GameDto { Address = "address  " },
            AwaySubmission = new GameDto { Address = "address  " },
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Address, Is.EqualTo("address"));
        Assert.That(result.HomeSubmission!.Address, Is.EqualTo("address"));
        Assert.That(result.AwaySubmission!.Address, Is.EqualTo("address"));
    }
}