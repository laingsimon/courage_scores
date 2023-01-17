using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class TournamentSideAdapterTests
{
    private static readonly GamePlayer Player = new GamePlayer();
    private static readonly GamePlayerDto PlayerDto = new GamePlayerDto();
    private readonly CancellationToken _token = new CancellationToken();
    private readonly TournamentSideAdapter _adapter = new TournamentSideAdapter(
        new MockAdapter<GamePlayer, GamePlayerDto>(Player, PlayerDto));

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new TournamentSide
        {
            Id = Guid.NewGuid(),
            Name = "name",
            Players = { Player }
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.Players, Is.EqualTo(new[] { PlayerDto }));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var model = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "name",
            Players = { PlayerDto }
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.Players, Is.EqualTo(new[] { Player }));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhitespace()
    {
        var model = new TournamentSideDto
        {
            Name = "name   ",
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Name, Is.EqualTo("name"));
    }

    [Test]
    public async Task Adapt_GivenDto_AcceptsNullName()
    {
        var model = new TournamentSideDto
        {
            Name = null,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Name, Is.Null);
    }
}