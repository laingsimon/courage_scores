using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Season.Creation;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Season.Creation;

[TestFixture]
public class DateTemplateAdapterTests
{
    private static readonly FixtureTemplate FixtureTemplate = new();
    private static readonly FixtureTemplateDto FixtureTemplateDto = new();
    private readonly CancellationToken _token = new();
    private DateTemplateAdapter _adapter = null!;
    private ISimpleAdapter<FixtureTemplate, FixtureTemplateDto> _fixtureAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _fixtureAdapter = new MockSimpleAdapter<FixtureTemplate, FixtureTemplateDto>(FixtureTemplate, FixtureTemplateDto);
        _adapter = new DateTemplateAdapter(_fixtureAdapter);
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new DateTemplateDto
        {
            Fixtures =
            {
                FixtureTemplateDto,
            },
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Fixtures, Is.EquivalentTo(new[]
        {
            FixtureTemplate,
        }));
    }

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new DateTemplate
        {
            Fixtures =
            {
                FixtureTemplate,
            },
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Fixtures, Is.EquivalentTo(new[]
        {
            FixtureTemplateDto,
        }));
    }
}