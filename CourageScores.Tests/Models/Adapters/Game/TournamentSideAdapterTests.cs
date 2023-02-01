using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class TournamentSideAdapterTests
{
    private static readonly TournamentSidePlayer Player = new TournamentSidePlayer();
    private static readonly TournamentSidePlayerDto PlayerDto = new TournamentSidePlayerDto();
    private readonly CancellationToken _token = new CancellationToken();
    private readonly TournamentSideAdapter _adapter = new TournamentSideAdapter(
        new MockAdapter<TournamentSidePlayer, TournamentSidePlayerDto>(Player, PlayerDto));

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new TournamentSide
        {
            Id = Guid.NewGuid(),
            Name = "name",
            Players = { Player },
            TeamId = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.Players, Is.EqualTo(new[] { PlayerDto }));
        Assert.That(result.TeamId, Is.EqualTo(model.TeamId));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "name",
            Players = { PlayerDto },
            TeamId = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.Players, Is.EqualTo(new[] { Player }));
        Assert.That(result.TeamId, Is.EqualTo(dto.TeamId));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhitespace()
    {
        var dto = new TournamentSideDto
        {
            Name = "name   ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("name"));
    }

    [Test]
    public async Task Adapt_GivenDto_AcceptsNullName()
    {
        var dto = new TournamentSideDto
        {
            Name = null,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenDto_AcceptsNullTeamId()
    {
        var dto = new TournamentSideDto
        {
            TeamId = null,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.TeamId, Is.Null);
    }
}
