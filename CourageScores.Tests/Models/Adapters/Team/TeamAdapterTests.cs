using AutoFixture;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Team;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using NUnit.Framework;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Tests.Models.Adapters.Team;

[TestFixture]
public class TeamAdapterTests
{
    private static readonly TeamSeason TeamSeason = new();
    private static readonly TeamSeasonDto TeamSeasonDto = new();
    private readonly CancellationToken _token = CancellationToken.None;
    private TeamAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        fixture.Register<IAdapter<TeamSeason, TeamSeasonDto>>(() => new MockAdapter<TeamSeason, TeamSeasonDto>(TeamSeason, TeamSeasonDto));
        _adapter = fixture.Create<TeamAdapter>();
    }

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

        var result = await _adapter.Adapt(model, UserAccessContext.None(), _token);

        Assert.That(result.Address, Is.EqualTo(model.Address));
        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.Seasons, Is.EqualTo([TeamSeasonDto]));
    }

    [Test]
    public async Task Adapt_GivenModel_TrimsWhitespace()
    {
        var model = new CosmosTeam
        {
            Address = "address ",
            Id = Guid.NewGuid(),
            Name = "name ",
            Seasons =
            {
                TeamSeason,
            },
            Version = 1,
        };

        var result = await _adapter.Adapt(model, UserAccessContext.None(), _token);

        Assert.That(result.Address, Is.EqualTo("address"));
        Assert.That(result.Name, Is.EqualTo("name"));
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

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result.Address, Is.EqualTo(dto.Address));
        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.Seasons, Is.EqualTo([TeamSeason]));
    }

    [Test]
    public async Task Adapt_GivenDto_RemovesTrailingWhitespace()
    {
        var dto = new TeamDto
        {
            Address = "address  ",
            Name = "name  ",
        };

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result.Address, Is.EqualTo("address"));
        Assert.That(result.Name, Is.EqualTo("name"));
    }
}
