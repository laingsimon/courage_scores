using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Health;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Season;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Health;

[TestFixture]
public class SeasonHealthDtoAdapterTests
{
    private readonly CancellationToken _token = new();
    private Mock<ISimpleOnewayAdapter<DivisionDataDto, DivisionHealthDto>> _divisionAdapter = null!;
    private SeasonHealthDtoAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _divisionAdapter = new Mock<ISimpleOnewayAdapter<DivisionDataDto, DivisionHealthDto>>();
        _adapter = new SeasonHealthDtoAdapter(_divisionAdapter.Object);
    }

    [Test]
    public async Task Adapt_GivenMapping_ShouldSetPropertiesCorrectly()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Name = "SEASON",
            StartDate = new DateTime(2001, 02, 03),
            EndDate = new DateTime(2002, 03, 04),
        };
        var division = new DivisionDataDto();
        var divisionDto = new DivisionHealthDto();
        var mapping = new SeasonHealthDtoAdapter.SeasonAndDivisions(season, new List<DivisionDataDto>
        {
            division,
        });
        _divisionAdapter.Setup(a => a.Adapt(division, _token)).ReturnsAsync(divisionDto);

        var result = await _adapter.Adapt(mapping, _token);

        Assert.That(result.Id, Is.EqualTo(season.Id));
        Assert.That(result.Name, Is.EqualTo(season.Name));
        Assert.That(result.StartDate, Is.EqualTo(season.StartDate));
        Assert.That(result.EndDate, Is.EqualTo(season.EndDate));
        Assert.That(result.Divisions, Is.EqualTo(new[]
        {
            divisionDto,
        }));
    }
}