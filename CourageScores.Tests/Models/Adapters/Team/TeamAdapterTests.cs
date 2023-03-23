using CourageScores.Models.Adapters.Team;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Team;

[TestFixture]
public class TeamAdapterTests
{
    private static readonly TeamSeason TeamSeason = new TeamSeason();
    private static readonly TeamSeasonDto TeamSeasonDto = new TeamSeasonDto();
    private readonly CancellationToken _token = new CancellationToken();
    private readonly TeamAdapter _adapter = new TeamAdapter(
        new MockAdapter<TeamSeason, TeamSeasonDto>(TeamSeason, TeamSeasonDto));

    [Test]
    public async Task Adapt_GivenModel_MapsPropertiesSuccessfully()
    {
        var model = new CourageScores.Models.Cosmos.Team.Team
        {
            Address = "address",
            Id = Guid.NewGuid(),
            Name = "name",
#pragma warning disable CS0618
            DivisionId = Guid.NewGuid(),
#pragma warning restore CS0618
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
#pragma warning disable CS0618
        Assert.That(result.DivisionId, Is.EqualTo(model.DivisionId));
#pragma warning restore CS0618
        Assert.That(result.Seasons, Is.EqualTo(new[] { TeamSeasonDto }));
    }

    [Test]
    public async Task Adapt_GivenDto_MapsPropertiesSuccessfully()
    {
        var dto = new TeamDto
        {
            Address = "address",
            Id = Guid.NewGuid(),
            Name = "name",
#pragma warning disable CS0618
            DivisionId = Guid.NewGuid(),
#pragma warning restore CS0618
            Seasons =
            {
                TeamSeasonDto,
            },
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Address, Is.EqualTo(dto.Address));
        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
#pragma warning disable CS0618
        Assert.That(result.DivisionId, Is.EqualTo(dto.DivisionId));
#pragma warning restore CS0618
        Assert.That(result.Seasons, Is.EqualTo(new[] { TeamSeason }));
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