using AutoFixture;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services.Identity;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class TournamentSideAdapterTests
{
    private static readonly TournamentPlayer Player = new();
    private static readonly TournamentPlayerDto PlayerDto = new();
    private readonly CancellationToken _token = CancellationToken.None;
    private TournamentSideAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();

        fixture.Register<IAdapter<TournamentPlayer, TournamentPlayerDto>>(() => new MockAdapter<TournamentPlayer, TournamentPlayerDto>(Player, PlayerDto));

        _adapter = fixture.Create<TournamentSideAdapter>();
    }

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new TournamentSide
        {
            Id = Guid.NewGuid(),
            Name = "name",
            Players =
            {
                Player,
            },
            TeamId = Guid.NewGuid(),
            NoShow = true,
        };

        var result = await _adapter.Adapt(model, UserAccessContext.None(), _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.Players, Is.EqualTo([PlayerDto]));
        Assert.That(result.TeamId, Is.EqualTo(model.TeamId));
        Assert.That(result.NoShow, Is.True);
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "name",
            Players =
            {
                PlayerDto,
            },
            TeamId = Guid.NewGuid(),
            NoShow = true,
        };

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.Players, Is.EqualTo([Player]));
        Assert.That(result.TeamId, Is.EqualTo(dto.TeamId));
        Assert.That(result.NoShow, Is.True);
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhitespace()
    {
        var dto = new TournamentSideDto
        {
            Name = "name   ",
        };

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result.Name, Is.EqualTo("name"));
    }

    [Test]
    public async Task Adapt_GivenDto_AcceptsNullName()
    {
        var dto = new TournamentSideDto
        {
            Name = null,
        };

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result.Name, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenDto_AcceptsNullTeamId()
    {
        var dto = new TournamentSideDto
        {
            TeamId = null,
        };

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result.TeamId, Is.Null);
    }
}
