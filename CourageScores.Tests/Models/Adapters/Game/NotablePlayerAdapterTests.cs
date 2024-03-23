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
#pragma warning disable CS0618 // Type or member is obsolete
        Assert.That(result.Notes, Is.EqualTo(model.Notes));
#pragma warning restore CS0618 // Type or member is obsolete
        Assert.That(result.Score, Is.EqualTo(123));
    }

    [Test]
    public async Task Adapt_GivenDto_MapsPropertiesCorrectly()
    {
        var dto = new NotablePlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
#pragma warning disable CS0618 // Type or member is obsolete
            Notes = "123",
#pragma warning restore CS0618 // Type or member is obsolete
            Score = 456,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.Notes, Is.EqualTo("456"));
    }

    [Test]
    public async Task Adapt_GivenNotesOnly_SetsNotesCorrectly()
    {
        var dto = new NotablePlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
#pragma warning disable CS0618 // Type or member is obsolete
            Notes = "123",
#pragma warning restore CS0618 // Type or member is obsolete
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.Notes, Is.EqualTo("123"));
    }

    [Test]
    [Obsolete("Tests Notes which is obsolete")]
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