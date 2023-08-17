using CourageScores.Models.Adapters.Team;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using NUnit.Framework;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Tests.Models.Adapters.Team;

[TestFixture]
public class TeamAdapterTests
{
    private static readonly TeamSeason TeamSeason = new();
    private static readonly TeamSeasonDto TeamSeasonDto = new();
    private readonly CancellationToken _token = new();
    private readonly TeamAdapter _adapter = new(
        new MockAdapter<TeamSeason, TeamSeasonDto>(TeamSeason, TeamSeasonDto));

    [Test]
    public async Task Adapt_GivenModel_MapsPropertiesSuccessfully()
    {
        var model = new CosmosTeam
        {
            Address = "address",
            Id = Guid.NewGuid(),
            Name = "name",
            Seasons =
            {
                TeamSeason,
            },
            Version = 1,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Address, Is.EqualTo(model.Address));
        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.Seasons, Is.EqualTo(new[]
        {
            TeamSeasonDto,
        }));
    }

    [Test]
    public async Task Adapt_GivenDto_MapsPropertiesSuccessfully()
    {
        var dto = new TeamDto
        {
            Address = "address",
            Id = Guid.NewGuid(),
            Name = "name",
            Seasons =
            {
                TeamSeasonDto,
            },
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Address, Is.EqualTo(dto.Address));
        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.Seasons, Is.EqualTo(new[]
        {
            TeamSeason,
        }));
    }

    [Test]
    public async Task Adapt_GivenDto_RemovesTrailingWhitespace()
    {
        var dto = new TeamDto
        {
            Address = "address  ",
            Name = "name  ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Address, Is.EqualTo("address"));
        Assert.That(result.Name, Is.EqualTo("name"));
    }
}