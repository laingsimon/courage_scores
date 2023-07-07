using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class GamePlayerAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly GamePlayerAdapter _adapter = new GamePlayerAdapter();

    [Test]
    public async Task Adapt_GivenModel_MapsPropertiesCorrectly()
    {
        var model = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
    }

    [Test]
    public async Task Adapt_GivenModel_TrimsWhitespace()
    {
        var model = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "Simon  ",
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Name, Is.EqualTo("Simon"));
    }

    [Test]
    public async Task Adapt_GivenDto_MapsPropertiesCorrectly()
    {
        var dto = new GamePlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsTrailingWhitespace()
    {
        var dto = new GamePlayerDto
        {
            Name = "Simon   ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("Simon"));
    }
}