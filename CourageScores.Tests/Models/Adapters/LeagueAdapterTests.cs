using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters;

[TestFixture]
public class LeagueAdapterTests
{
    private static readonly Season Season = new Season();
    private static readonly SeasonDto SeasonDto = new SeasonDto();
    private static readonly Division Division = new Division();
    private static readonly DivisionDto DivisionDto = new DivisionDto();
    private readonly CancellationToken _token = new CancellationToken();
    private readonly LeagueAdapter _adapter = new LeagueAdapter(
        new MockAdapter<Division, DivisionDto>(Division, DivisionDto),
        new MockAdapter<Season, SeasonDto>(Season, SeasonDto));

    [Test]
    public async Task Adapt_GivenModel_MapsPropertiesCorrectly()
    {
        var model = new League
        {
            Id = Guid.NewGuid(),
            Name = "League 1",
            Seasons =
            {
                Season
            },
            Divisions =
            {
                Division
            }
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
    }

    [Test]
    public async Task Adapt_GivenDto_MapsPropertiesCorrectly()
    {
        var dto = new LeagueDto
        {
            Id = Guid.NewGuid(),
            Name = "League 1",
            Seasons =
            {
                SeasonDto
            },
            Divisions =
            {
                DivisionDto
            }
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhitespaceFromName()
    {
        var dto = new LeagueDto
        {
            Id = Guid.NewGuid(),
            Name = "League 1   ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("League 1"));
    }
}