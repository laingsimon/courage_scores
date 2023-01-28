using CourageScores.Models.Cosmos.Game;
using CourageScores.Services.Report;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class PlayerLookupTests
{
    [Test]
    public void VisitGame_GivenGameWithNoMatches_AddsNoPlayers()
    {
        var game = new Game();
        var lookup = new PlayerLookup();

        Assert.That(() => lookup.VisitGame(game), Throws.Nothing);
    }

    [Test]
    public async Task GetPlayer_GivenNoPlayers_ReturnsEmptyPlayerDetails()
    {
        var lookup = new PlayerLookup();

        var player = await lookup.GetPlayer(Guid.NewGuid());

        Assert.That(player, Is.Not.Null);
        Assert.That(player.TeamId, Is.EqualTo(Guid.Empty));
        Assert.That(player.PlayerName, Is.Null);
        Assert.That(player.TeamName, Is.Null);
    }

    [Test]
    public async Task GetPlayer_GivenMatches_ReturnsHomePlayer()
    {
        var homePlayer = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "HOME PLAYER",
        };
        var awayPlayer = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "AWAY PLAYER",
        };
        var game = new Game
        {
            Home = new GameTeam
            {
                Id = Guid.NewGuid(),
                Name = "HOME",
            },
            Away = new GameTeam
            {
                Id = Guid.NewGuid(),
                Name = "HOME",
            },
            Matches =
            {
                new GameMatch
                {
                    HomePlayers = {homePlayer},
                    AwayPlayers = {awayPlayer},
                },
            },
        };
        var lookup = new PlayerLookup();
        lookup.VisitGame(game);

        var player = await lookup.GetPlayer(homePlayer.Id);

        Assert.That(player, Is.Not.Null);
        Assert.That(player.TeamId, Is.EqualTo(game.Home.Id));
        Assert.That(player.PlayerName, Is.EqualTo(homePlayer.Name));
        Assert.That(player.TeamName, Is.EqualTo(game.Home.Name));
    }

    [Test]
    public async Task GetPlayer_GivenMatches_ReturnsAwayPlayer()
    {
        var homePlayer = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "HOME PLAYER",
        };
        var awayPlayer = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "AWAY PLAYER",
        };
        var game = new Game
        {
            Home = new GameTeam
            {
                Id = Guid.NewGuid(),
                Name = "HOME",
            },
            Away = new GameTeam
            {
                Id = Guid.NewGuid(),
                Name = "HOME",
            },
            Matches =
            {
                new GameMatch
                {
                    HomePlayers = { homePlayer },
                    AwayPlayers = { awayPlayer },
                },
            },
        };
        var lookup = new PlayerLookup();
        lookup.VisitGame(game);

        var player = await lookup.GetPlayer(awayPlayer.Id);

        Assert.That(player, Is.Not.Null);
        Assert.That(player.TeamId, Is.EqualTo(game.Away.Id));
        Assert.That(player.PlayerName, Is.EqualTo(awayPlayer.Name));
        Assert.That(player.TeamName, Is.EqualTo(game.Away.Name));
    }
}