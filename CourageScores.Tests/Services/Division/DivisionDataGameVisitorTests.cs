using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionDataGameVisitorTests
{
    private static readonly Guid SeasonId = Guid.NewGuid();
    private static readonly TeamPlayerDto HomePlayer = new TeamPlayerDto
    {
        Id = Guid.NewGuid(),
        Name = "home_player",
    };
    private static readonly TeamPlayerDto AwayPlayer = new TeamPlayerDto
    {
        Id = Guid.NewGuid(),
        Name = "away_player",
    };
    private static readonly TeamDto Home = new TeamDto
    {
        Id = Guid.NewGuid(),
        Name = "home",
        Seasons =
        {
            new TeamSeasonDto
            {
                Id = Guid.NewGuid(),
                SeasonId = SeasonId,
                Players =
                {
                    HomePlayer
                }
            }
        }
    };
    private static readonly TeamDto Away = new TeamDto
    {
        Id = Guid.NewGuid(),
        Name = "away",
        Seasons =
        {
            new TeamSeasonDto
            {
                Id = Guid.NewGuid(),
                SeasonId = SeasonId,
                Players =
                {
                    AwayPlayer
                }
            }
        }
    };

    [Test]
    public void VisitDataError_AddsError()
    {
        var divisionData = new DivisionData();
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitDataError("some error");

        Assert.That(divisionData.DataErrors, Has.Member("some error"));
    }

    [Test]
    public void VisitGame_GivenPostponedGame_IgnoresData()
    {
        var divisionData = new DivisionData();
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            Postponed = true,
            Id = Guid.NewGuid(),
            SeasonId = SeasonId,
            Date = new DateTime(2001, 02, 03),
            Home = new GameTeam { Id = Home.Id, Name = Home.Name },
            Away = new GameTeam { Id = Away.Id, Name = Away.Name },
            Matches =
            {
                new GameMatch
                {
                    HomePlayers = { new GamePlayer { Id = HomePlayer.Id } },
                    AwayPlayers = { new GamePlayer { Id = AwayPlayer.Id } },
                },
            }
        };
        var teamLookup = new Dictionary<Guid, TeamDto>
        {
            { game.Home.Id, Home },
            { game.Away.Id, Away },
        };
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitGame(game);

        Assert.That(divisionData.PlayersToFixtures, Is.Empty);
        Assert.That(divisionData.PlayerIdToTeamLookup, Is.Empty);
    }

    [Test]
    public void VisitGame_GivenTeamNotRegisteredToSeason_IgnoresTeam()
    {
        var divisionData = new DivisionData();
        var homePlayer = new GamePlayer { Id = HomePlayer.Id };
        var awayPlayer = new GamePlayer { Id = AwayPlayer.Id };
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            Postponed = false,
            Id = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
            Home = new GameTeam { Id = Home.Id, Name = Home.Name },
            Away = new GameTeam { Id = Away.Id, Name = Away.Name },
            Matches =
            {
                new GameMatch
                {
                    HomePlayers = { homePlayer },
                    AwayPlayers = { awayPlayer },
                },
            }
        };
        var teamLookup = new Dictionary<Guid, TeamDto>
        {
            { game.Home.Id, Home },
            { game.Away.Id, Away },
        };
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitGame(game);

        Assert.That(divisionData.PlayerIdToTeamLookup.Keys, Is.Empty);
    }

    [Test]
    public void VisitGame_GivenGame_AddsPlayersIntoGameToPlayerLookup()
    {
        var divisionData = new DivisionData();
        var homePlayer = new GamePlayer { Id = HomePlayer.Id };
        var awayPlayer = new GamePlayer { Id = AwayPlayer.Id };
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            Postponed = false,
            Id = Guid.NewGuid(),
            SeasonId = SeasonId,
            Date = new DateTime(2001, 02, 03),
            Home = new GameTeam { Id = Home.Id, Name = Home.Name },
            Away = new GameTeam { Id = Away.Id, Name = Away.Name },
            Matches =
            {
                new GameMatch
                {
                    HomePlayers = { homePlayer },
                    AwayPlayers = { awayPlayer },
                },
            }
        };
        var teamLookup = new Dictionary<Guid, TeamDto>
        {
            { game.Home.Id, Home },
            { game.Away.Id, Away },
        };
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitGame(game);

        var mapping = divisionData.PlayersToFixtures;
        Assert.That(mapping.Keys, Is.EquivalentTo(new[] { homePlayer.Id, awayPlayer.Id }));
        Assert.That(mapping[homePlayer.Id].Keys, Is.EquivalentTo(new[] { game.Date }));
        Assert.That(mapping[awayPlayer.Id].Keys, Is.EquivalentTo(new[] { game.Date }));
        Assert.That(mapping[homePlayer.Id][game.Date], Is.EqualTo(game.Id));
        Assert.That(mapping[awayPlayer.Id][game.Date], Is.EqualTo(game.Id));
    }

    [Test]
    public void VisitGame_GivenGame_AddsPlayersIntoPlayerTeamLookup()
    {
        var divisionData = new DivisionData();
        var homePlayer = new GamePlayer { Id = HomePlayer.Id };
        var awayPlayer = new GamePlayer { Id = AwayPlayer.Id };
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            Postponed = false,
            Id = Guid.NewGuid(),
            SeasonId = SeasonId,
            Date = new DateTime(2001, 02, 03),
            Home = new GameTeam { Id = Home.Id, Name = Home.Name },
            Away = new GameTeam { Id = Away.Id, Name = Away.Name },
            Matches =
            {
                new GameMatch
                {
                    HomePlayers = { homePlayer },
                    AwayPlayers = { awayPlayer },
                },
            }
        };
        var teamLookup = new Dictionary<Guid, TeamDto>
        {
            { game.Home.Id, Home },
            { game.Away.Id, Away },
        };
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitGame(game);

        var mapping = divisionData.PlayerIdToTeamLookup;
        Assert.That(mapping.Keys, Is.EquivalentTo(new[] { homePlayer.Id, awayPlayer.Id }));
        Assert.That(mapping[homePlayer.Id].Player, Is.EqualTo(HomePlayer));
        Assert.That(mapping[homePlayer.Id].Team, Is.EqualTo(Home));
        Assert.That(mapping[awayPlayer.Id].Player, Is.EqualTo(AwayPlayer));
        Assert.That(mapping[awayPlayer.Id].Team, Is.EqualTo(Away));
    }

    [Test]
    public void VisitMatchWin_GivenSomePlayers_RecordsPlayerWinRateForAllPlayers()
    {
        var divisionData = new DivisionData();
        var homePlayer1 = new GamePlayer { Id = HomePlayer.Id };
        var homePlayer2 = new GamePlayer { Id = Guid.NewGuid() };
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitMatchWin(new[] { homePlayer1, homePlayer2 }, TeamDesignation.Home, 3, 2);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[] { homePlayer1.Id, homePlayer2.Id }));
        var player1Scores = divisionData.Players[homePlayer1.Id];
        var player2Scores = divisionData.Players[homePlayer2.Id];
        Assert.That(player1Scores.PlayerPlayCount[2].MatchesWon, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[2].MatchesPlayed, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[2].PlayerWinRate, Is.EqualTo(3));
        Assert.That(player1Scores.PlayerPlayCount[2].PlayerLossRate, Is.EqualTo(2));
        Assert.That(player1Scores.PlayerPlayCount[2].MatchesPlayed, Is.EqualTo(1));
        Assert.That(player2Scores.PlayerPlayCount[2].MatchesWon, Is.EqualTo(1));
        Assert.That(player2Scores.PlayerPlayCount[2].PlayerWinRate, Is.EqualTo(3));
        Assert.That(player2Scores.PlayerPlayCount[2].PlayerLossRate, Is.EqualTo(2));
    }

    [Test]
    public void VisitMatchWin_GivenSomePlayers_RecordsPlayerTeamRateForFirstPlayerOnly()
    {
        var divisionData = new DivisionData();
        var homePlayer1 = new GamePlayer { Id = HomePlayer.Id };
        var homePlayer2 = new GamePlayer { Id = Guid.NewGuid() };
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitMatchWin(new[] { homePlayer1, homePlayer2 }, TeamDesignation.Home, 3, 2);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[] { homePlayer1.Id, homePlayer2.Id }));
        var player1Scores = divisionData.Players[homePlayer1.Id];
        var player2Scores = divisionData.Players[homePlayer2.Id];
        Assert.That(player1Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(3));
        Assert.That(player1Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(2));
        Assert.That(player2Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(0));
        Assert.That(player2Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(0));
    }

    [Test]
    public void VisitMatchWin_GivenDifferingNumberOfPlayers_RecordsScoresAgainstCorrectNumberOfPlayers()
    {
        var divisionData = new DivisionData();
        var homePlayer1 = new GamePlayer { Id = HomePlayer.Id };
        var homePlayer2 = new GamePlayer { Id = Guid.NewGuid() };
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitMatchWin(new[] { homePlayer1, homePlayer2 }, TeamDesignation.Home, 3, 2);
        visitor.VisitMatchWin(new[] { homePlayer1 }, TeamDesignation.Home, 3, 1);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[] { homePlayer1.Id, homePlayer2.Id }));
        var player1Scores = divisionData.Players[homePlayer1.Id];
        Assert.That(player1Scores.PlayerPlayCount[2].MatchesWon, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[2].MatchesPlayed, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[2].PlayerWinRate, Is.EqualTo(3));
        Assert.That(player1Scores.PlayerPlayCount[2].PlayerLossRate, Is.EqualTo(2));
        Assert.That(player1Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(3));
        Assert.That(player1Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(2));
        Assert.That(player1Scores.PlayerPlayCount[1].MatchesPlayed, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[1].MatchesWon, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[1].PlayerWinRate, Is.EqualTo(3));
        Assert.That(player1Scores.PlayerPlayCount[1].PlayerLossRate, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[1].TeamWinRate, Is.EqualTo(3));
        Assert.That(player1Scores.PlayerPlayCount[1].TeamLossRate, Is.EqualTo(1));
    }

    [Test]
    public void VisitMatchLost_GivenSomePlayers_RecordsPlayerWinRateForAllPlayers()
    {
        var divisionData = new DivisionData();
        var homePlayer1 = new GamePlayer { Id = HomePlayer.Id };
        var homePlayer2 = new GamePlayer { Id = Guid.NewGuid() };
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitMatchLost(new[] { homePlayer1, homePlayer2 }, TeamDesignation.Home, 2, 3);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[] { homePlayer1.Id, homePlayer2.Id }));
        var player1Scores = divisionData.Players[homePlayer1.Id];
        var player2Scores = divisionData.Players[homePlayer2.Id];
        Assert.That(player1Scores.PlayerPlayCount[2].MatchesLost, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[2].MatchesPlayed, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[2].PlayerWinRate, Is.EqualTo(2));
        Assert.That(player1Scores.PlayerPlayCount[2].PlayerLossRate, Is.EqualTo(3));
        Assert.That(player1Scores.PlayerPlayCount[2].MatchesPlayed, Is.EqualTo(1));
        Assert.That(player2Scores.PlayerPlayCount[2].MatchesLost, Is.EqualTo(1));
        Assert.That(player2Scores.PlayerPlayCount[2].PlayerWinRate, Is.EqualTo(2));
        Assert.That(player2Scores.PlayerPlayCount[2].PlayerLossRate, Is.EqualTo(3));
    }

    [Test]
    public void VisitMatchLost_GivenSomePlayers_RecordsPlayerTeamRateForFirstPlayerOnly()
    {
        var divisionData = new DivisionData();
        var homePlayer1 = new GamePlayer { Id = HomePlayer.Id };
        var homePlayer2 = new GamePlayer { Id = Guid.NewGuid() };
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitMatchLost(new[] { homePlayer1, homePlayer2 }, TeamDesignation.Home, 2, 3);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[] { homePlayer1.Id, homePlayer2.Id }));
        var player1Scores = divisionData.Players[homePlayer1.Id];
        var player2Scores = divisionData.Players[homePlayer2.Id];
        Assert.That(player1Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(2));
        Assert.That(player1Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(3));
        Assert.That(player2Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(0));
        Assert.That(player2Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(0));
    }

    [Test]
    public void VisitMatchLost_GivenDifferingNumberOfPlayers_RecordsScoresAgainstCorrectNumberOfPlayers()
    {
        var divisionData = new DivisionData();
        var homePlayer1 = new GamePlayer { Id = HomePlayer.Id };
        var homePlayer2 = new GamePlayer { Id = Guid.NewGuid() };
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitMatchLost(new[] { homePlayer1, homePlayer2 }, TeamDesignation.Home, 2, 3);
        visitor.VisitMatchLost(new[] { homePlayer1 }, TeamDesignation.Home, 1, 3);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[] { homePlayer1.Id, homePlayer2.Id }));
        var player1Scores = divisionData.Players[homePlayer1.Id];
        Assert.That(player1Scores.PlayerPlayCount[2].MatchesLost, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[2].MatchesPlayed, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[2].PlayerWinRate, Is.EqualTo(2));
        Assert.That(player1Scores.PlayerPlayCount[2].PlayerLossRate, Is.EqualTo(3));
        Assert.That(player1Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(2));
        Assert.That(player1Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(3));
        Assert.That(player1Scores.PlayerPlayCount[1].MatchesPlayed, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[1].MatchesLost, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[1].PlayerWinRate, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[1].PlayerLossRate, Is.EqualTo(3));
        Assert.That(player1Scores.PlayerPlayCount[1].TeamWinRate, Is.EqualTo(1));
        Assert.That(player1Scores.PlayerPlayCount[1].TeamLossRate, Is.EqualTo(3));
    }

    [Test]
    public void VisitOneEighty_GivenPlayer_AddsOneEighty()
    {
        var divisionData = new DivisionData();
        var homePlayer1 = new GamePlayer { Id = HomePlayer.Id };
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitOneEighty(homePlayer1);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[] { homePlayer1.Id }));
        var player1Scores = divisionData.Players[homePlayer1.Id];
        Assert.That(player1Scores.OneEighties, Is.EqualTo(1));
    }

    [Test]
    public void VisitHiCheckout_GivenPlayerWithNewHiCheck_AddsOneScore()
    {
        var divisionData = new DivisionData();
        var homePlayer1 = new NotablePlayer { Id = HomePlayer.Id, Notes = "120" };
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitHiCheckout(homePlayer1);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[] { homePlayer1.Id }));
        var player1Scores = divisionData.Players[homePlayer1.Id];
        Assert.That(player1Scores.HiCheckout, Is.EqualTo(120));
    }

    [Test]
    public void VisitHiCheckout_GivenPlayerWithNewHiCheckWithTrailingWhitespace_AddsOneScore()
    {
        var divisionData = new DivisionData();
        var homePlayer1 = new NotablePlayer { Id = HomePlayer.Id, Notes = "120  " };
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitHiCheckout(homePlayer1);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[] { homePlayer1.Id }));
        var player1Scores = divisionData.Players[homePlayer1.Id];
        Assert.That(player1Scores.HiCheckout, Is.EqualTo(120));
    }

    [Test]
    public void VisitHiCheckout_GivenPlayerWithLowerHiCheckThanPrevious_IgnoresScore()
    {
        var divisionData = new DivisionData();
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitHiCheckout(new NotablePlayer { Id = HomePlayer.Id, Notes = "120" });
        visitor.VisitHiCheckout(new NotablePlayer { Id = HomePlayer.Id, Notes = "110" });

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[] { HomePlayer.Id }));
        var player1Scores = divisionData.Players[HomePlayer.Id];
        Assert.That(player1Scores.HiCheckout, Is.EqualTo(120));
    }

    [Test]
    public void VisitHiCheckout_GivenPlayerWithNonNumericScore_IgnoresScore()
    {
        var divisionData = new DivisionData();
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);

        visitor.VisitHiCheckout(new NotablePlayer { Id = HomePlayer.Id, Notes = "wibble" });

        Assert.That(divisionData.Players.Keys, Is.Empty);
    }

    [Test]
    public void VisitTeam_GivenUnPlayedGame_IgnoresTeam()
    {
        var divisionData = new DivisionData();
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);
        var team = new GameTeam { Id = Home.Id, Name = Home.Name };

        visitor.VisitTeam(team, GameState.Pending);

        Assert.That(divisionData.Teams.Keys, Is.Empty);
    }

    [Test]
    public void VisitTeam_GivenPlayedGame_RecordsTeamWithGamePlayed()
    {
        var divisionData = new DivisionData();
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);
        var team = new GameTeam { Id = Home.Id, Name = Home.Name };

        visitor.VisitTeam(team, GameState.Played);

        Assert.That(divisionData.Teams.Keys, Is.EquivalentTo(new[] { team.Id }));
        Assert.That(divisionData.Teams[team.Id].FixturesPlayed, Is.EqualTo(1));
    }

    [Test]
    public void VisitTeam_GivenSubsequentPlayedGame_RecordsTeamWithAnotherGamePlayed()
    {
        var divisionData = new DivisionData();
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);
        var team = new GameTeam { Id = Home.Id, Name = Home.Name };

        visitor.VisitTeam(team, GameState.Played);
        visitor.VisitTeam(team, GameState.Played);

        Assert.That(divisionData.Teams.Keys, Is.EquivalentTo(new[] { team.Id }));
        Assert.That(divisionData.Teams[team.Id].FixturesPlayed, Is.EqualTo(2));
    }

    [Test]
    public void VisitGameDraw_GivenTeams_RecordsDrawForBothTeams()
    {
        var divisionData = new DivisionData();
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);
        var homeTeam = new GameTeam { Id = Home.Id, Name = Home.Name };
        var awayTeam = new GameTeam { Id = Away.Id, Name = Away.Name };

        visitor.VisitGameDraw(homeTeam, awayTeam);

        Assert.That(divisionData.Teams.Keys, Is.EquivalentTo(new[] { homeTeam.Id, awayTeam.Id }));
        Assert.That(divisionData.Teams[homeTeam.Id].FixturesDrawn, Is.EqualTo(1));
        Assert.That(divisionData.Teams[awayTeam.Id].FixturesDrawn, Is.EqualTo(1));
    }

    [Test]
    public void VisitGameWinner_GivenTeam_RecordsFixtureWon()
    {
        var divisionData = new DivisionData();
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);
        var team = new GameTeam { Id = Home.Id, Name = Home.Name };

        visitor.VisitGameWinner(team);

        Assert.That(divisionData.Teams.Keys, Is.EquivalentTo(new[] { team.Id }));
        Assert.That(divisionData.Teams[team.Id].FixturesWon, Is.EqualTo(1));
    }

    [Test]
    public void VisitGameLoser_GivenTeam_RecordsFixtureWon()
    {
        var divisionData = new DivisionData();
        var teamLookup = new Dictionary<Guid, TeamDto>();
        var visitor = new DivisionDataGameVisitor(divisionData, teamLookup);
        var team = new GameTeam { Id = Home.Id, Name = Home.Name };

        visitor.VisitGameLoser(team);

        Assert.That(divisionData.Teams.Keys, Is.EquivalentTo(new[] { team.Id }));
        Assert.That(divisionData.Teams[team.Id].FixturesLost, Is.EqualTo(1));
    }
}