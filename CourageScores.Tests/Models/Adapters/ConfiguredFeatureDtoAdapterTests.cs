using CourageScores.Models;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Repository;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters;

[TestFixture]
public class ConfiguredFeatureDtoAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<IFeatureLookup> _featureLookup = null!;
    private ConfiguredFeatureDtoAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _featureLookup = new Mock<IFeatureLookup>();
        _adapter = new ConfiguredFeatureDtoAdapter(_featureLookup.Object);
    }

    [Test]
    public async Task Adapt_GivenUnknownFeatureModel_SetsPropertiesCorrectly()
    {
        var configuredFeature = new ConfiguredFeature
        {
            Id = Guid.NewGuid(),
            ConfiguredValue = "CONFIGURED",
        };
        _featureLookup.Setup(l => l.Get(It.IsAny<Guid>())).Returns(() => null);

        var result = await _adapter.Adapt(configuredFeature, _token);

        Assert.That(result.ConfiguredValue, Is.EqualTo("CONFIGURED"));
        Assert.That(result.DefaultValue, Is.Null);
        Assert.That(result.Description, Is.EqualTo(""));
        Assert.That(result.Id, Is.EqualTo(configuredFeature.Id));
        Assert.That(result.Name, Is.EqualTo(configuredFeature.Id.ToString()));
        Assert.That(result.ValueType, Is.EqualTo(Feature.FeatureValueType.Unknown));
    }

    [Test]
    public async Task Adapt_GivenKnownFeatureModel_SetsPropertiesCorrectly()
    {
        var feature = new Feature(Guid.NewGuid(), "NAME", "DESCRIPTION", Feature.FeatureValueType.String, null, new Dictionary<Guid, Feature>());
        var configuredFeature = new ConfiguredFeature
        {
            Id = feature.Id,
            ConfiguredValue = "CONFIGURED",
        };
        _featureLookup.Setup(l => l.Get(feature.Id)).Returns(feature);

        var result = await _adapter.Adapt(configuredFeature, _token);

        Assert.That(result.ConfiguredValue, Is.EqualTo("CONFIGURED"));
        Assert.That(result.DefaultValue, Is.Null);
        Assert.That(result.Description, Is.EqualTo("DESCRIPTION"));
        Assert.That(result.Id, Is.EqualTo(feature.Id));
        Assert.That(result.Name, Is.EqualTo("NAME"));
        Assert.That(result.ValueType, Is.EqualTo(Feature.FeatureValueType.String));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new ConfiguredFeatureDto
        {
            ValueType = Feature.FeatureValueType.String,
            ConfiguredValue = "CONFIGURED",
            Id = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.ConfiguredValue, Is.EqualTo("CONFIGURED"));
    }
}