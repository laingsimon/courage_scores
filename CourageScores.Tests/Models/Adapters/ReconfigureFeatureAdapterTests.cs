using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters;

[TestFixture]
public class ReconfigureFeatureAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly ReconfigureFeatureAdapter _adapter = new ReconfigureFeatureAdapter();

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var input = new ReconfigureFeatureDto
        {
            Id = Guid.NewGuid(),
            ConfiguredValue = "VALUE",
        };

        var result = await _adapter.Adapt(input, _token);

        Assert.That(result.Id, Is.EqualTo(input.Id));
        Assert.That(result.ConfiguredValue, Is.EqualTo(input.ConfiguredValue));
    }

    [Test]
    public async Task Adapt_GivenModel_TrimsWhitespaceFromConfiguredValue()
    {
        var input = new ReconfigureFeatureDto
        {
            Id = Guid.NewGuid(),
            ConfiguredValue = "VALUE   ",
        };

        var result = await _adapter.Adapt(input, _token);

        Assert.That(result.ConfiguredValue, Is.EqualTo("VALUE"));
    }

    [Test]
    public async Task Adapt_GivenNullConfiguredValue_SetsConfiguredValueToNull()
    {
        var input = new ReconfigureFeatureDto
        {
            Id = Guid.NewGuid(),
            ConfiguredValue = null,
        };

        var result = await _adapter.Adapt(input, _token);

        Assert.That(result.ConfiguredValue, Is.Null);
    }
}