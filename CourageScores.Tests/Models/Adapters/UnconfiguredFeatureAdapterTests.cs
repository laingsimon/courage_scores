using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters;

[TestFixture]
public class UnconfiguredFeatureAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<IAdapter<ConfiguredFeature, ConfiguredFeatureDto>> _configuredFeatureAdapter = null!;
    private UnconfiguredFeatureAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _configuredFeatureAdapter = new Mock<IAdapter<ConfiguredFeature, ConfiguredFeatureDto>>();
        _adapter = new UnconfiguredFeatureAdapter(_configuredFeatureAdapter.Object);
    }

    [Test]
    public async Task Adapt_WhenCalled_ReturnsAdaptedFeature()
    {
        var id = Guid.NewGuid();
        var adapted = new ConfiguredFeatureDto
        {
            Id = id,
        };
        _configuredFeatureAdapter.Setup(a => a.Adapt(It.IsAny<ConfiguredFeature>(), _token)).ReturnsAsync(adapted);

        var result = await _adapter.Adapt(id, _token);

        _configuredFeatureAdapter.Verify(a => a.Adapt(It.Is<ConfiguredFeature>(f => f.Id == id && f.ConfiguredValue == null), _token));
        Assert.That(result.Id, Is.EqualTo(id));
    }
}