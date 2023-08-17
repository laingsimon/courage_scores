using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class GameMatchAdapterTests
{
    private static readonly GamePlayer HomePlayer = new();
    private static readonly GamePlayerDto HomePlayerDto = new();
    private static readonly GamePlayer AwayPlayer = new();
    private static readonly GamePlayerDto AwayPlayerDto = new();
    private static readonly GamePlayer OneEightyPlayer = new();
    private static readonly GamePlayerDto OneEightyPlayerDto = new();
    private static readonly ScoreAsYouGo ScoreAsYouGo = new();
    private static readonly ScoreAsYouGoDto ScoreAsYouGoDto = new();
    private readonly CancellationToken _token = new();
    private readonly GameMatchAdapter _adapter = new(
        new MockAdapter<GamePlayer, GamePlayerDto>(
            new[]
            {
                HomePlayer,
                AwayPlayer,
                OneEightyPlayer,
            },
            new[]
            {
                HomePlayerDto,
                AwayPlayerDto,
                OneEightyPlayerDto,
            }),
        new MockSimpleAdapter<ScoreAsYouGo, ScoreAsYouGoDto>(ScoreAsYouGo, ScoreAsYouGoDto));

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new GameMatch
        {
            HomeScore = 1,
            AwayScore = 2,
            Id = Guid.NewGuid(),
            AwayPlayers =
            {
                AwayPlayer,
            },
            HomePlayers =
            {
                HomePlayer,
            },
            Sayg = ScoreAsYouGo,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.HomeScore, Is.EqualTo(model.HomeScore));
        Assert.That(result.AwayScore, Is.EqualTo(model.AwayScore));
        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.HomePlayers, Is.EqualTo(new[]
        {
            HomePlayerDto,
        }));
        Assert.That(result.AwayPlayers, Is.EqualTo(new[]
        {
            AwayPlayerDto,
        }));
        Assert.That(result.Sayg, Is.EqualTo(ScoreAsYouGoDto));
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
        Assert.That(result.Sayg, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new GameMatchDto
        {
            HomeScore = 1,
            AwayScore = 2,
            Id = Guid.NewGuid(),
            AwayPlayers =
            {
                AwayPlayerDto,
            },
            HomePlayers =
            {
                HomePlayerDto,
            },
            Sayg = ScoreAsYouGoDto,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.HomeScore, Is.EqualTo(dto.HomeScore));
        Assert.That(result.AwayScore, Is.EqualTo(dto.AwayScore));
        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.HomePlayers, Is.EqualTo(new[]
        {
            HomePlayer,
        }));
        Assert.That(result.AwayPlayers, Is.EqualTo(new[]
        {
            AwayPlayer,
        }));
        Assert.That(result.Sayg, Is.EqualTo(ScoreAsYouGo));
    }

    [Test]
    public async Task Adapt_GivenDtoWithoutSayh_SetsSaygToNull()
    {
        var dto = new GameMatchDto
        {
            Sayg = null,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Sayg, Is.Null);
    }
}