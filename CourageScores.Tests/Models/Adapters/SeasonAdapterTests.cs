using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters;

[TestFixture]
public class SeasonAdapterTests
{
    private static readonly Division Division = new Division();
    private static readonly DivisionDto DivisionDto = new DivisionDto();
    private readonly CancellationToken _token = new CancellationToken();
    private readonly SeasonAdapter _adapter = new SeasonAdapter(
        new MockAdapter<Division, DivisionDto>(Division, DivisionDto));

    [Test]
    public async Task Adapt_GivenModel_MapsPropertiesCorrectly()
    {
        var model = new Season
        {
            Id = Guid.NewGuid(),
            Name = "Season 1",
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
        var dto = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Name = "Season 1",
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
        var dto = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Name = "Season 1   ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("Season 1"));
    }
}