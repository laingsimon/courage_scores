using AutoFixture;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters;

[TestFixture]
public class UnconfiguredFeatureAdapterTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<IAdapter<ConfiguredFeature, ConfiguredFeatureDto>> _configuredFeatureAdapter = null!;
    private UnconfiguredFeatureAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _configuredFeatureAdapter = fixture.FreezeMock<IAdapter<ConfiguredFeature, ConfiguredFeatureDto>>();
        _adapter = fixture.Create<UnconfiguredFeatureAdapter>();
    }

    [Test]
    public async Task Adapt_WhenCalled_ReturnsAdaptedFeature()
    {
        var id = Guid.NewGuid();
        var adapted = new ConfiguredFeatureDto
        {
            Id = id,
        };
        _configuredFeatureAdapter.Setup(a => a.Adapt(It.IsAny<ConfiguredFeature>(), It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(adapted);

        var result = await _adapter.Adapt(id, UserAccessContext.None(), _token);

        _configuredFeatureAdapter.Verify(a => a.Adapt(It.Is<ConfiguredFeature>(f => f.Id == id && f.ConfiguredValue == null), It.IsAny<UserAccessContext>(), _token));
        Assert.That(result.Id, Is.EqualTo(id));
    }
}
