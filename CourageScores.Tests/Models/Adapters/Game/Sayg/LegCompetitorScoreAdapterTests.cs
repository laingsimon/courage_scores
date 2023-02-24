using CourageScores.Models.Adapters.Game.Sayg;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game.Sayg;

[TestFixture]
public class LegCompetitorScoreAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private LegCompetitorScoreAdapter _adapter = null!;
    private LegThrow _legThrow = null!;
    private LegThrowDto _legThrowDto = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _legThrow = new LegThrow();
        _legThrowDto = new LegThrowDto();
        _adapter = new LegCompetitorScoreAdapter(
            new MockSimpleAdapter<LegThrow, LegThrowDto>(_legThrow, _legThrowDto));
    }

    [TestCase(501, 100, false)]
    [TestCase(501, 500, true)]
    [TestCase(501, 501, false)]
    [TestCase(501, 502, true)]
    public async Task Adapt_GivenModel_ReturnsBustCorrectly(int startingScore, int sumOfThrows, bool expectedBust)
    {
        _legThrow.Score = sumOfThrows;
        var context = new LegCompetitorScoreAdapterContext(
            startingScore,
            new LegCompetitorScore
            {
                Throws = { _legThrow }
            });

        var result = await _adapter.Adapt(context, _token);

        Assert.That(result.Bust, Is.EqualTo(expectedBust));
    }

    [TestCase(501, 100, 100)]
    [TestCase(501, 500, 0)]
    [TestCase(501, 501, 501)]
    [TestCase(501, 502, 0)]
    public async Task Adapt_GivenModel_ReturnsScoreCorrectly(int startingScore, int sumOfThrows, int expectedScore)
    {
        _legThrow.Score = sumOfThrows;
        var context = new LegCompetitorScoreAdapterContext(
            startingScore,
            new LegCompetitorScore
            {
                Throws = { _legThrow }
            });

        var result = await _adapter.Adapt(context, _token);

        Assert.That(result.Score, Is.EqualTo(expectedScore));
    }

    [Test]
    public async Task Adapt_GivenModel_ReturnsThrowsCorrectly()
    {
        var context = new LegCompetitorScoreAdapterContext(
            501,
            new LegCompetitorScore
            {
                Throws = { _legThrow }
            });

        var result = await _adapter.Adapt(context, _token);

        Assert.That(result.Throws, Is.EqualTo(new[] { _legThrowDto }));
    }

    [Test]
    public async Task Adapt_GivenModel_ReturnsNoOfDartsCorrectly()
    {
        _legThrow.NoOfDarts = 3;
        var context = new LegCompetitorScoreAdapterContext(
            501,
            new LegCompetitorScore
            {
                Throws = { _legThrow }
            });

        var result = await _adapter.Adapt(context, _token);

        Assert.That(result.NoOfDarts, Is.EqualTo(3));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new LegCompetitorScoreDto
        {
            Bust = true,
            Throws =
            {
                _legThrowDto
            }
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Score.Bust, Is.True);
        Assert.That(result.Score.Throws, Is.EqualTo(new[] { _legThrow }));
    }
}