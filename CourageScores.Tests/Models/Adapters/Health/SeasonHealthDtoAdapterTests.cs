using AutoFixture;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Health;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Tests.Services;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Health;

[TestFixture]
public class SeasonHealthDtoAdapterTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<ISimpleOnewayAdapter<DivisionDataDto, DivisionHealthDto>> _divisionAdapter = null!;
    private SeasonHealthDtoAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _divisionAdapter = fixture.FreezeMock<ISimpleOnewayAdapter<DivisionDataDto, DivisionHealthDto>>();
        _adapter = fixture.Create<SeasonHealthDtoAdapter>();
    }

    [Test]
    public async Task Adapt_GivenMapping_ShouldSetPropertiesCorrectly()
    {
        var season = new SeasonDtoBuilder()
            .WithDates(new DateTime(2001, 02, 03), new DateTime(2002, 03, 04))
            .Build();
        var division = new DivisionDataDto(null);
        var divisionDto = new DivisionHealthDto();
        var mapping = new SeasonHealthDtoAdapter.SeasonAndDivisions(season, [division]);
        _divisionAdapter.Setup(a => a.Adapt(division, _token)).ReturnsAsync(divisionDto);

        var result = await _adapter.Adapt(mapping, _token);

        Assert.That(result.Id, Is.EqualTo(season.Id));
        Assert.That(result.Name, Is.EqualTo(season.Name));
        Assert.That(result.StartDate, Is.EqualTo(season.StartDate));
        Assert.That(result.EndDate, Is.EqualTo(season.EndDate));
        Assert.That(result.Divisions, Is.EqualTo([divisionDto]));
    }
}
