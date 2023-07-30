using CourageScores.Models.Adapters.Season.Creation;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Tests.Models.Dtos.Season.Creation;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Season.Creation;

[TestFixture]
public class FixtureTemplateAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private FixtureTemplateAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _adapter = new FixtureTemplateAdapter();
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new FixtureTemplateDto
        {
            Home = new TeamPlaceholderDto("H"),
            Away = new TeamPlaceholderDto("A"),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Home, Is.EqualTo("H"));
        Assert.That(result.Away, Is.EqualTo("A"));
    }

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new FixtureTemplate
        {
            Home = "H",
            Away = "A",
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Home, Is.EqualTo(new TeamPlaceholderDto("H")).Using(new TeamPlaceholderDtoEqualityComparer()));
        Assert.That(result.Away, Is.EqualTo(new TeamPlaceholderDto("A")).Using(new TeamPlaceholderDtoEqualityComparer()));
    }
}