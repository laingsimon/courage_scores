using CourageScores.Models.Adapters;
using CourageScores.Tests.Services;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters;

[TestFixture]
public class DivisionAdapterTests
{
    private readonly CancellationToken _token = new();
    private readonly DivisionAdapter _adapter = new();

    [Test]
    public async Task Adapt_GivenModel_MapsPropertiesCorrectly()
    {
        var model = new CourageScores.Models.Cosmos.Division
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
    }

    [Test]
    public async Task Adapt_GivenDto_MapsPropertiesCorrectly()
    {
        var dto = new DivisionDtoBuilder(name: "Division 1").Build();

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhitespaceFromName()
    {
        var dto = new DivisionDtoBuilder(name: "Division 1   ").Build();

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("Division 1"));
    }
}