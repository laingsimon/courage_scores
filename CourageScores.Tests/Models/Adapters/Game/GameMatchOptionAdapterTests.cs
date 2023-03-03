using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class GameMatchOptionAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();

    [Test]
    public async Task Adapt_GivenNullDto_ReturnsNullModel()
    {
        var adapter = new GameMatchOptionAdapter();

        var result = await adapter.Adapt((GameMatchOptionDto?)null, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenNullModel_ReturnsNullDto()
    {
        var adapter = new GameMatchOptionAdapter();

        var result = await adapter.Adapt((GameMatchOption?)null, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var adapter = new GameMatchOptionAdapter();
        var dto = new GameMatchOptionDto
        {
            NumberOfLegs = 3,
            StartingScore = 501,
        };

        var result = await adapter.Adapt(dto, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.NumberOfLegs, Is.EqualTo(3));
        Assert.That(result.StartingScore, Is.EqualTo(501));
    }
    
    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var adapter = new GameMatchOptionAdapter();
        var model = new GameMatchOption
        {
            NumberOfLegs = 3,
            StartingScore = 501,
        };

        var result = await adapter.Adapt(model, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.NumberOfLegs, Is.EqualTo(3));
        Assert.That(result.StartingScore, Is.EqualTo(501));
    }
}