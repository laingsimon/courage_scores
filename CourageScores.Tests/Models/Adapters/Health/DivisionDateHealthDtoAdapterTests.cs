using AutoFixture;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Health;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Health;

[TestFixture]
public class DivisionDateHealthDtoAdapterTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private DivisionDateHealthDtoAdapter _adapter = null!;
    private Mock<ISimpleOnewayAdapter<LeagueFixtureHealthDtoAdapter.FixtureDateMapping, LeagueFixtureHealthDto?>> _fixtureAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();

        _fixtureAdapter = fixture.FreezeMock<ISimpleOnewayAdapter<LeagueFixtureHealthDtoAdapter.FixtureDateMapping, LeagueFixtureHealthDto?>>();
        _adapter = fixture.Create<DivisionDateHealthDtoAdapter>();
    }

    [Test]
    public async Task Adapt_GivenDivisionDateDto_ShouldSetPropertiesCorrectly()
    {
        var fixture = new DivisionFixtureDto();
        var fixtureDto = new LeagueFixtureHealthDto();
        var model = new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            Fixtures =
            {
                fixture,
            },
        };
        _fixtureAdapter
            .Setup(a => a.Adapt(It.Is<LeagueFixtureHealthDtoAdapter.FixtureDateMapping>(m => m.Fixture == fixture && m.Date == model.Date), It.IsAny<UserAccessContext>(), _token))
            .ReturnsAsync(fixtureDto);

        var result = await _adapter.Adapt(model, UserAccessContext.None(), _token);

        Assert.That(result.Date, Is.EqualTo(model.Date));
        Assert.That(result.Fixtures, Is.EqualTo([fixtureDto]));
    }
}
