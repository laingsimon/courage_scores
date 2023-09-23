using CourageScores.Models.Adapters.Game.Sayg;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game.Sayg;

[TestFixture]
public class LegThrowAdapterTests
{
    private readonly CancellationToken _token = new();
    private readonly LegThrowAdapter _adapter = new();

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new LegThrow
        {
            Score = 100,
            NoOfDarts = 3,
            Bust = true,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Score, Is.EqualTo(model.Score));
        Assert.That(result.NoOfDarts, Is.EqualTo(model.NoOfDarts));
        Assert.That(result.Bust, Is.EqualTo(model.Bust));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new LegThrowDto
        {
            Score = 100,
            NoOfDarts = 3,
            Bust = true,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Score, Is.EqualTo(dto.Score));
        Assert.That(result.NoOfDarts, Is.EqualTo(dto.NoOfDarts));
        Assert.That(result.Bust, Is.EqualTo(dto.Bust));
    }
}