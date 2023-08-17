using CourageScores.Models.Cosmos.Game;
using CourageScores.Services.Report;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class PlayerLookupTests
{
    [Test]
    public void VisitGame_GivenGameWithNoMatches_AddsNoPlayers()
    {
        var game = new CosmosGame();
        var lookup = new PlayerLookup();

        Assert.That(() => lookup.VisitGame(game), Throws.Nothing);
    }

    [Test]
    public async Task VisitGame_GivenPostponedFixture_AddsNoPlayers()
    {
        var playerId = Guid.NewGuid();
        var game = new CosmosGame
        {
            Postponed = true,
            Home = new GameTeam(),
            Away = new GameTeam(),
            Matches =
            {
                new GameMatch
                {
                    HomePlayers =
                    {
                        new GamePlayer
                        {
                            Id = playerId,
                        },
                    },
                },
            },
        };
        var lookup = new PlayerLookup();

        lookup.VisitGame(game);

        var playerDetails = await lookup.GetPlayer(playerId);
        Assert.That(playerDetails, Is.Not.Null);
        Assert.That(playerDetails.PlayerName, Is.Null);
    }

    [Test]
    public async Task VisitGame_GivenPlayedFixture_AddsPlayers()
    {
        var homeTeam = new GameTeam
        {
            Name = "Home team",
            Id = Guid.NewGuid(),
        };
        var awayTeam = new GameTeam
        {
            Name = "Away team",
            Id = Guid.NewGuid(),
        };
        var homePlayerId = Guid.NewGuid();
        var awayPlayerId = Guid.NewGuid();
        var game = new CosmosGame
        {
            Home = homeTeam,
            Away = awayTeam,
            Matches =
            {
                new GameMatch
                {
                    HomePlayers =
                    {
                        new GamePlayer
                        {
                            Id = homePlayerId,
                            Name = "Home player",
                        },
                    },
                    AwayPlayers =
                    {
                        new GamePlayer
                        {
                            Id = awayPlayerId,
                            Name = "Away player",
                        },
                    },
                },
            },
        };
        var lookup = new PlayerLookup();

        lookup.VisitGame(game);

        var homePlayerDetails = await lookup.GetPlayer(homePlayerId);
        Assert.That(homePlayerDetails, Is.Not.Null);
        Assert.That(homePlayerDetails.PlayerName, Is.EqualTo("Home player"));
        Assert.That(homePlayerDetails.TeamName, Is.EqualTo("Home team"));
        Assert.That(homePlayerDetails.TeamId, Is.EqualTo(homeTeam.Id));
        var awayPlayerDetails = await lookup.GetPlayer(awayPlayerId);
        Assert.That(awayPlayerDetails, Is.Not.Null);
        Assert.That(awayPlayerDetails.PlayerName, Is.EqualTo("Away player"));
        Assert.That(awayPlayerDetails.TeamName, Is.EqualTo("Away team"));
        Assert.That(awayPlayerDetails.TeamId, Is.EqualTo(awayTeam.Id));
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
        var game = new CosmosGame
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
                    HomePlayers =
                    {
                        homePlayer,
                    },
                    AwayPlayers =
                    {
                        awayPlayer,
                    },
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
        var game = new CosmosGame
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
                    HomePlayers =
                    {
                        homePlayer,
                    },
                    AwayPlayers =
                    {
                        awayPlayer,
                    },
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