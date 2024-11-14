using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Game.Sayg;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game.Sayg;

[TestFixture]
public class LegAdapterTests
{
    private readonly CancellationToken _token = new();
    private LegAdapter _adapter = null!;
    private LegCompetitorScoreDto _homeScoreDto = null!;
    private LegCompetitorScoreDto _awayScoreDto = null!;
    private LegPlayerSequence _legPlayerSequence = null!;
    private LegPlayerSequenceDto _legPlayerSequenceDto = null!;
    private LegCompetitorScore _homeScore = null!;
    private LegCompetitorScore _awayScore = null!;
    private Mock<ISimpleAdapter<LegCompetitorScoreAdapterContext, LegCompetitorScoreDto>> _legCompetitorScoreAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _homeScore = new LegCompetitorScore();
        _awayScore = new LegCompetitorScore();
        _homeScoreDto = new LegCompetitorScoreDto();
        _awayScoreDto = new LegCompetitorScoreDto();
        _legPlayerSequence = new LegPlayerSequence();
        _legPlayerSequenceDto = new LegPlayerSequenceDto();
        _legCompetitorScoreAdapter =
            new Mock<ISimpleAdapter<LegCompetitorScoreAdapterContext, LegCompetitorScoreDto>>();

        _adapter = new LegAdapter(
            _legCompetitorScoreAdapter.Object,
            new MockSimpleAdapter<LegPlayerSequence, LegPlayerSequenceDto>(_legPlayerSequence, _legPlayerSequenceDto));

        _legCompetitorScoreAdapter
            .Setup(a => a.Adapt(It.IsAny<LegCompetitorScoreAdapterContext>(), _token))
            .ReturnsAsync((LegCompetitorScoreAdapterContext context, CancellationToken _) =>
            {
                if (context.Score == _homeScore)
                {
                    return _homeScoreDto;
                }

                if (context.Score == _awayScore)
                {
                    return _awayScoreDto;
                }

                throw new InvalidOperationException("Unexpected adaptation");
            });

        _legCompetitorScoreAdapter
            .Setup(a => a.Adapt(It.IsAny<LegCompetitorScoreDto>(), _token))
            .ReturnsAsync((LegCompetitorScoreDto dto, CancellationToken _) =>
            {
                if (dto == _homeScoreDto)
                {
                    return new LegCompetitorScoreAdapterContext(0, _homeScore);
                }

                if (dto == _awayScoreDto)
                {
                    return new LegCompetitorScoreAdapterContext(0, _awayScore);
                }

                throw new InvalidOperationException("Unexpected adaptation");
            });
    }

    [Test]
    public async Task Adapt_GivenModel_SetsHomeAndAwayCorrectly()
    {
        var leg = new Leg
        {
            Home = _homeScore,
            Away = _awayScore,
        };

        var result = await _adapter.Adapt(leg, _token);

        Assert.That(result.Home, Is.EqualTo(_homeScoreDto));
        Assert.That(result.Away, Is.EqualTo(_awayScoreDto));
    }

    [TestCase(CompetitorType.Home, "home")]
    [TestCase(CompetitorType.Away, "away")]
    [TestCase(null, null)]
    public async Task Adapt_GivenModel_SetsCurrentThrowCorrectly(CompetitorType? currentThrow, string expected)
    {
        var leg = new Leg
        {
            Home = _homeScore,
            Away = _awayScore,
            CurrentThrow = currentThrow,
        };

        var result = await _adapter.Adapt(leg, _token);

        Assert.That(result.CurrentThrow, Is.EqualTo(expected));
    }

    [Test]
    public async Task Adapt_GivenModel_SetsStartingScoreCorrectly()
    {
        var leg = new Leg
        {
            Home = _homeScore,
            Away = _awayScore,
            StartingScore = 501,
        };

        var result = await _adapter.Adapt(leg, _token);

        Assert.That(result.StartingScore, Is.EqualTo(leg.StartingScore));
    }

    [Test]
    public async Task Adapt_GivenModel_SetsIsLastLegCorrectly()
    {
        var leg = new Leg
        {
            Home = _homeScore,
            Away = _awayScore,
            IsLastLeg = true,
        };

        var result = await _adapter.Adapt(leg, _token);

        Assert.That(result.IsLastLeg, Is.True);
    }

    [Test]
    public async Task Adapt_GivenModel_SetsPlayerSequenceCorrectly()
    {
        var leg = new Leg
        {
            Home = _homeScore,
            Away = _awayScore,
            PlayerSequence =
            {
                _legPlayerSequence,
            },
        };

        var result = await _adapter.Adapt(leg, _token);

        Assert.That(result.PlayerSequence, Is.EqualTo(new[]
        {
            _legPlayerSequenceDto,
        }));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsHomeAndAwayCorrectly()
    {
        var leg = new LegDto
        {
            Home = _homeScoreDto,
            Away = _awayScoreDto,
        };

        var result = await _adapter.Adapt(leg, _token);

        Assert.That(result.Home, Is.EqualTo(_homeScore));
        Assert.That(result.Away, Is.EqualTo(_awayScore));
    }

    [TestCase(null, null)]
    [TestCase("home", CompetitorType.Home)]
    [TestCase("away", CompetitorType.Away)]
    [TestCase("Home", CompetitorType.Home)]
    [TestCase("Away", CompetitorType.Away)]
    public async Task Adapt_GivenDto_SetsCurrentThrowCorrectly(string? currentThrow, CompetitorType? expected)
    {
        var leg = new LegDto
        {
            Home = _homeScoreDto,
            Away = _awayScoreDto,
            CurrentThrow = currentThrow,
        };

        var result = await _adapter.Adapt(leg, _token);

        Assert.That(result.CurrentThrow, Is.EqualTo(expected));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsStartingScoreCorrectly()
    {
        var leg = new LegDto
        {
            Home = _homeScoreDto,
            Away = _awayScoreDto,
            StartingScore = 501,
        };

        var result = await _adapter.Adapt(leg, _token);

        Assert.That(result.StartingScore, Is.EqualTo(leg.StartingScore));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsIsLastLegCorrectly()
    {
        var leg = new LegDto
        {
            Home = _homeScoreDto,
            Away = _awayScoreDto,
            IsLastLeg = true,
        };

        var result = await _adapter.Adapt(leg, _token);

        Assert.That(result.IsLastLeg, Is.True);
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPlayerSequenceCorrectly()
    {
        var leg = new LegDto
        {
            Home = _homeScoreDto,
            Away = _awayScoreDto,
            PlayerSequence =
            {
                _legPlayerSequenceDto,
            },
        };

        var result = await _adapter.Adapt(leg, _token);

        Assert.That(result.PlayerSequence, Is.EqualTo(new[]
        {
            _legPlayerSequence,
        }));
    }
}