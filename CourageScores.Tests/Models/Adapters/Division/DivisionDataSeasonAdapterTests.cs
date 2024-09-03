using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Dtos;
using CourageScores.Tests.Services;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionDataSeasonAdapterTests
{
    private readonly CancellationToken _token = new();
    private readonly DivisionDataSeasonAdapter _adapter = new();

    [Test]
    public async Task Adapt_GivenSeasonDto_SetsPropertiesCorrectly()
    {
        var division = new DivisionDto();
        var model = new SeasonDtoBuilder()
            .WithDates(new DateTime(2001, 02, 03), new DateTime(2002, 03, 04))
            .WithDivisions(division)
            .Updated(new DateTime(2003, 04, 05))
            .Build();

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.StartDate, Is.EqualTo(model.StartDate));
        Assert.That(result.EndDate, Is.EqualTo(model.EndDate));
        Assert.That(result.Divisions, Is.EqualTo(new[]
        {
            division,
        }));
        Assert.That(result.Updated, Is.EqualTo(model.Updated));
    }
}