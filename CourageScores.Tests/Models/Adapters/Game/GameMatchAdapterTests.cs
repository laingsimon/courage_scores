using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class GameMatchAdapterTests
{
    private static readonly GamePlayer HomePlayer = new GamePlayer();
    private static readonly GamePlayerDto HomePlayerDto = new GamePlayerDto();
    private static readonly GamePlayer AwayPlayer = new GamePlayer();
    private static readonly GamePlayerDto AwayPlayerDto = new GamePlayerDto();
    private static readonly GamePlayer OneEightyPlayer = new GamePlayer();
    private static readonly GamePlayerDto OneEightyPlayerDto = new GamePlayerDto();
    private static readonly NotablePlayer HiCheckPlayer = new NotablePlayer();
    private static readonly NotablePlayerDto HiCheckPlayerDto = new NotablePlayerDto();
    private readonly CancellationToken _token = new CancellationToken();
    private readonly GameMatchAdapter _adapter = new GameMatchAdapter(
        new MockAdapter<GamePlayer, GamePlayerDto>(
            new[] { HomePlayer, AwayPlayer, OneEightyPlayer },
            new[] { HomePlayerDto, AwayPlayerDto, OneEightyPlayerDto }),
        new MockAdapter<NotablePlayer, NotablePlayerDto>(HiCheckPlayer, HiCheckPlayerDto));

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new GameMatch
        {
            HomeScore = 1,
            AwayScore = 2,
            Id = Guid.NewGuid(),
            Over100Checkouts = { HiCheckPlayer },
            AwayPlayers = { AwayPlayer },
            HomePlayers = { HomePlayer },
            OneEighties = { OneEightyPlayer },
            StartingScore = 501,
            NumberOfLegs = 3,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.HomeScore, Is.EqualTo(model.HomeScore));
        Assert.That(result.AwayScore, Is.EqualTo(model.AwayScore));
        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.StartingScore, Is.EqualTo(model.StartingScore));
        Assert.That(result.NumberOfLegs, Is.EqualTo(model.NumberOfLegs));
        Assert.That(result.Over100Checkouts, Is.EqualTo(new[] { HiCheckPlayerDto }));
        Assert.That(result.OneEighties, Is.EqualTo(new[] { OneEightyPlayerDto }));
        Assert.That(result.HomePlayers, Is.EqualTo(new[] { HomePlayerDto }));
        Assert.That(result.AwayPlayers, Is.EqualTo(new[] { AwayPlayerDto }));
    }

    [Test]
    public async Task Adapt_GivenModelWithoutAnyScoreOrPlayers_SetsPropertiesCorrectly()
    {
        var model = new GameMatch();

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.HomeScore, Is.Null);
        Assert.That(result.AwayScore, Is.Null);
        Assert.That(result.HomePlayers, Is.Empty);
        Assert.That(result.AwayPlayers, Is.Empty);
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new GameMatchDto
        {
            HomeScore = 1,
            AwayScore = 2,
            Id = Guid.NewGuid(),
            Over100Checkouts = { HiCheckPlayerDto },
            AwayPlayers = { AwayPlayerDto },
            HomePlayers = { HomePlayerDto },
            OneEighties = { OneEightyPlayerDto },
            StartingScore = 501,
            NumberOfLegs = 3,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.HomeScore, Is.EqualTo(dto.HomeScore));
        Assert.That(result.AwayScore, Is.EqualTo(dto.AwayScore));
        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.StartingScore, Is.EqualTo(dto.StartingScore));
        Assert.That(result.NumberOfLegs, Is.EqualTo(dto.NumberOfLegs));
        Assert.That(result.Over100Checkouts, Is.EqualTo(new[] { HiCheckPlayer }));
        Assert.That(result.OneEighties, Is.EqualTo(new[] { OneEightyPlayer }));
        Assert.That(result.HomePlayers, Is.EqualTo(new[] { HomePlayer }));
        Assert.That(result.AwayPlayers, Is.EqualTo(new[] { AwayPlayer }));
    }
}