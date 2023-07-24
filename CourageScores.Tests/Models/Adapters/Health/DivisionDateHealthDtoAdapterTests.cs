using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Health;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Health;

[TestFixture]
public class DivisionDateHealthDtoAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private DivisionDateHealthDtoAdapter _adapter = null!;
    private Mock<ISimpleOnewayAdapter<DivisionFixtureDto,LeagueFixtureHealthDto>> _fixtureAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _fixtureAdapter = new Mock<ISimpleOnewayAdapter<DivisionFixtureDto, LeagueFixtureHealthDto>>();
        _adapter = new DivisionDateHealthDtoAdapter(_fixtureAdapter.Object);
    }

    [Test]
    public async Task Adapt_GivenDivisionDateDto_ShouldSetPropertiesCorrectly()
    {
        var fixture = new DivisionFixtureDto();
        var fixtureDto = new LeagueFixtureHealthDto();
        var model = new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            Fixtures = { fixture },
        };
        _fixtureAdapter.Setup(a => a.Adapt(fixture, _token)).ReturnsAsync(fixtureDto);

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Date, Is.EqualTo(model.Date));
        Assert.That(result.Fixtures, Is.EqualTo(new[] { fixtureDto }));
    }
}