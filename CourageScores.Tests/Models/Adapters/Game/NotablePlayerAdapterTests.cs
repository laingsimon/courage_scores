using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class NotablePlayerAdapterTests
{
    private readonly CancellationToken _token = new();
    private readonly NotablePlayerAdapter _adapter = new();

    [Test]
    public async Task Adapt_GivenModel_MapsPropertiesCorrectly()
    {
        var model = new NotablePlayer
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
            Notes = "123",
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.Notes, Is.EqualTo(model.Notes));
    }

    [Test]
    public async Task Adapt_GivenDto_MapsPropertiesCorrectly()
    {
        var dto = new NotablePlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
            Notes = "123",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.Notes, Is.EqualTo(dto.Notes));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsTrailingWhitespace()
    {
        var dto = new NotablePlayerDto
        {
            Name = "Simon   ",
            Notes = "123  ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("Simon"));
        Assert.That(result.Notes, Is.EqualTo("123"));
    }
}