using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using CourageScores.Tests.Models.Cosmos.Game;
using CourageScores.Tests.Models.Dtos;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionDataGameVisitorTests
{
    private static readonly SeasonDto Season = new SeasonDtoBuilder().Build();
    private static readonly GamePlayer HomePlayer1 = new GamePlayer
    {
        Id = Guid.NewGuid(),
        Name = "home_player",
    };
    private static readonly GamePlayer HomePlayer2 = new GamePlayer
    {
        Id = Guid.NewGuid(),
    };
    private static readonly GamePlayer AwayPlayer1 = new GamePlayer
    {
        Id = Guid.NewGuid(),
        Name = "away_player",
    };
    private static readonly TeamPlayerDto HomeTeamPlayer = new()
    {
        Id = HomePlayer1.Id,
        Name = "home_player",
    };
    private static readonly TeamPlayerDto AwayTeamPlayer = new()
    {
        Id = AwayPlayer1.Id,
        Name = "away_player",
    };
    private static readonly TeamDto Home = new TeamDtoBuilder()
        .WithName("home")
        .WithSeason(s => s.ForSeason(Season).WithPlayers(HomePlayer1))
        .Build();
    private static readonly TeamDto Away = new TeamDtoBuilder()
        .WithName("away")
        .WithSeason(s => s.ForSeason(Season).WithPlayers(AwayPlayer1))
        .Build();
    private static readonly IVisitorScope LeagueVisitorScope = new VisitorScope
    {
        Game = new CosmosGame(),
    };
    private static readonly IVisitorScope KnockoutVisitorScope = new VisitorScope
    {
        Game = new CosmosGame
        {
            IsKnockout = true,
        },
    };
    private static readonly IVisitorScope VetoedVisitorScope = new VisitorScope
    {
        Game = new CosmosGame(),
        ObscureScores = true,
    };
    private static readonly IVisitorScope TournamentVisitorScope = new VisitorScope
    {
        Tournament = new TournamentGame(),
    };
    // hi-check
    private static readonly NotablePlayer HiCheckPlayer = new NotablePlayer
    {
        Id = HomeTeamPlayer.Id,
        Notes = "120",
    };
    private static readonly GameTeam HomeTeam = new GameTeam
    {
        Id = Home.Id,
        Name = Home.Name,
    };
    private static readonly GameTeam AwayTeam = new GameTeam
    {
        Id = Away.Id,
        Name = Away.Name,
    };
    private DivisionData _divisionData = null!;
    private DivisionDataGameVisitor _visitor = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _divisionData = new DivisionData();
        _visitor = new DivisionDataGameVisitor(_divisionData);
    }

    [Test]
    public void VisitDataError_AddsError()
    {
        _visitor.VisitDataError(LeagueVisitorScope, "some error");

        Assert.That(_divisionData.DataErrors.Select(de => de.Message), Has.Member("some error"));
    }

    [Test]
    public void VisitGame_GivenPostponedGame_IgnoresData()
    {
        var game = new GameBuilder()
            .Postponed()
            .ForSeason(Season)
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Home, Away)
            .WithMatch(m => m.WithHomePlayers(HomeTeamPlayer.Id).WithAwayPlayers(AwayTeamPlayer.Id))
            .Build();

        _visitor.VisitGame(game);

        Assert.That(_divisionData.PlayersToFixtures, Is.Empty);
    }

    [Test]
    public void VisitGame_WhenScoresObscured_AddsPlayersIntoGameToPlayerLookup()
    {
        var game = new GameBuilder()
            .ForSeason(Season)
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Home, Away)
            .WithMatch(m => m.WithHomePlayers(HomeTeamPlayer.Id).WithAwayPlayers(AwayTeamPlayer.Id))
            .Build();

        _visitor.VisitGame(game);

        Assert.That(_divisionData.PlayersToFixtures, Is.Not.Empty);
    }

    [Test]
    public void VisitGame_GivenGame_AddsPlayersIntoGameToPlayerLookup()
    {
        var game = new GameBuilder()
            .ForSeason(Season)
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Home, Away)
            .WithMatch(m => m.WithHomePlayers(HomePlayer1).WithAwayPlayers(AwayPlayer1))
            .Build();

        _visitor.VisitGame(game);

        var mapping = _divisionData.PlayersToFixtures;
        Assert.That(mapping.Keys, Is.EquivalentTo(new[] { HomeTeamPlayer.Id, AwayTeamPlayer.Id }));
        Assert.That(mapping[HomeTeamPlayer.Id].Keys, Is.EquivalentTo(new[] { game.Date }));
        Assert.That(mapping[AwayTeamPlayer.Id].Keys, Is.EquivalentTo(new[] { game.Date }));
        Assert.That(mapping[HomeTeamPlayer.Id][game.Date], Is.EqualTo(game.Id));
        Assert.That(mapping[AwayTeamPlayer.Id][game.Date], Is.EqualTo(game.Id));
    }

    [Test]
    public void VisitMatchWin_GivenKnockoutFixture_DoesNothing()
    {
        _visitor.VisitMatchWin(KnockoutVisitorScope, new[] { HomePlayer1, HomePlayer2 }, TeamDesignation.Home, 3, 2);

        Assert.That(_divisionData.Players, Is.Empty);
    }

    [Test]
    public void VisitMatchWin_WhenScoresObscured_DoesNothing()
    {
        _visitor.VisitMatchWin(VetoedVisitorScope, new[] { HomePlayer1, HomePlayer2 }, TeamDesignation.Home, 3, 2);

        Assert.That(_divisionData.Players, Is.Empty);
    }

    [Test]
    public void VisitMatchWin_GivenSomePlayers_RecordsPlayerWinRateForAllPlayers()
    {
        _visitor.VisitMatchWin(LeagueVisitorScope, new[] { HomePlayer1, HomePlayer2 }, TeamDesignation.Home, 3, 2);

        AssertPlayerIds(_divisionData.Players, HomePlayer1, HomePlayer2);
        var player1Scores = _divisionData.Players[HomePlayer1.Id];
        var player2Scores = _divisionData.Players[HomePlayer2.Id];
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
        _visitor.VisitMatchWin(LeagueVisitorScope, new[] { HomePlayer1, HomePlayer2 }, TeamDesignation.Home, 3, 2);

        AssertPlayerIds(_divisionData.Players, HomePlayer1, HomePlayer2);
        var player1Scores = _divisionData.Players[HomePlayer1.Id];
        var player2Scores = _divisionData.Players[HomePlayer2.Id];
        Assert.That(player1Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(3));
        Assert.That(player1Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(2));
        Assert.That(player2Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(0));
        Assert.That(player2Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(0));
    }

    [Test]
    public void VisitMatchWin_GivenDifferingNumberOfPlayers_RecordsScoresAgainstCorrectNumberOfPlayers()
    {
        _visitor.VisitMatchWin(LeagueVisitorScope, new[] { HomePlayer1, HomePlayer2 }, TeamDesignation.Home, 3, 2);
        _visitor.VisitMatchWin(LeagueVisitorScope, new[] { HomePlayer1 }, TeamDesignation.Home, 3, 1);

        AssertPlayerIds(_divisionData.Players, HomePlayer1, HomePlayer2);
        var player1Scores = _divisionData.Players[HomePlayer1.Id];
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
        _visitor.VisitMatchLost(LeagueVisitorScope, new[] { HomePlayer1, HomePlayer2 }, TeamDesignation.Home, 2, 3);

        AssertPlayerIds(_divisionData.Players, HomePlayer1, HomePlayer2);
        var player1Scores = _divisionData.Players[HomePlayer1.Id];
        var player2Scores = _divisionData.Players[HomePlayer2.Id];
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
    public void VisitMatchLost_GivenKnockoutFixture_DoesNothing()
    {
        _visitor.VisitMatchLost(KnockoutVisitorScope, new[] { HomePlayer1, HomePlayer2 }, TeamDesignation.Home, 2, 3);

        Assert.That(_divisionData.Players, Is.Empty);
    }

    [Test]
    public void VisitMatchLost_WhenScoresObscured_DoesNothing()
    {
        _visitor.VisitMatchLost(VetoedVisitorScope, new[] { HomePlayer1, HomePlayer2 }, TeamDesignation.Home, 2, 3);

        Assert.That(_divisionData.Players, Is.Empty);
    }

    [Test]
    public void VisitMatchLost_GivenSomePlayers_RecordsPlayerTeamRateForFirstPlayerOnly()
    {
        _visitor.VisitMatchLost(LeagueVisitorScope, new[] { HomePlayer1, HomePlayer2 }, TeamDesignation.Home, 2, 3);

        AssertPlayerIds(_divisionData.Players, HomePlayer1, HomePlayer2);
        var player1Scores = _divisionData.Players[HomePlayer1.Id];
        var player2Scores = _divisionData.Players[HomePlayer2.Id];
        Assert.That(player1Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(2));
        Assert.That(player1Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(3));
        Assert.That(player2Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(0));
        Assert.That(player2Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(0));
    }

    [Test]
    public void VisitMatchLost_GivenDifferingNumberOfPlayers_RecordsScoresAgainstCorrectNumberOfPlayers()
    {
        _visitor.VisitMatchLost(LeagueVisitorScope, new[] { HomePlayer1, HomePlayer2 }, TeamDesignation.Home, 2, 3);
        _visitor.VisitMatchLost(LeagueVisitorScope, new[] { HomePlayer1 }, TeamDesignation.Home, 1, 3);

        AssertPlayerIds(_divisionData.Players, HomePlayer1, HomePlayer2);
        var player1Scores = _divisionData.Players[HomePlayer1.Id];
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
    public void VisitOneEighty_WhenScoresObscured_DoesNotAddOneEighty()
    {
        _visitor.VisitOneEighty(VetoedVisitorScope, HomePlayer1);

        AssertPlayerIds(_divisionData.Players);
    }

    [Test]
    public void VisitOneEighty_GivenPlayer_AddsOneEighty()
    {
        _visitor.VisitOneEighty(LeagueVisitorScope, HomePlayer1);

        AssertPlayerIds(_divisionData.Players, HomePlayer1);
        var player1Scores = _divisionData.Players[HomePlayer1.Id];
        Assert.That(player1Scores.OneEighties, Is.EqualTo(1));
    }

    [Test]
    public void VisitOneEighty_GivenKnockoutFixture_AddsOneEighty()
    {
        _visitor.VisitOneEighty(KnockoutVisitorScope, HomePlayer1);

        AssertPlayerIds(_divisionData.Players, HomePlayer1);
        var player1Scores = _divisionData.Players[HomePlayer1.Id];
        Assert.That(player1Scores.OneEighties, Is.EqualTo(1));
    }

    [Test]
    public void VisitOneEighty_GivenTournamentFixture_AddsOneEighty()
    {
        _visitor.VisitOneEighty(TournamentVisitorScope, HomePlayer1);

        AssertPlayerIds(_divisionData.Players, HomePlayer1);
        var player1Scores = _divisionData.Players[HomePlayer1.Id];
        Assert.That(player1Scores.OneEighties, Is.EqualTo(1));
    }

    [Test]
    public void VisitHiCheckout_WhenScoresObscured_DoesNotAddHiCheck()
    {
        _visitor.VisitHiCheckout(VetoedVisitorScope, HiCheckPlayer);

        AssertPlayerIds(_divisionData.Players);
    }

    [Test]
    public void VisitHiCheckout_GivenPlayerWithNewHiCheck_AddsOneScore()
    {
        _visitor.VisitHiCheckout(LeagueVisitorScope, HiCheckPlayer);

        AssertPlayerIds(_divisionData.Players, HiCheckPlayer);
        var player1Scores = _divisionData.Players[HiCheckPlayer.Id];
        Assert.That(player1Scores.HiCheckout, Is.EqualTo(120));
    }

    [Test]
    public void VisitHiCheckout_GivenKnockoutFixture_AddsOneScore()
    {
        _visitor.VisitHiCheckout(KnockoutVisitorScope, HiCheckPlayer);

        AssertPlayerIds(_divisionData.Players, HiCheckPlayer);
        var player1Scores = _divisionData.Players[HiCheckPlayer.Id];
        Assert.That(player1Scores.HiCheckout, Is.EqualTo(120));
    }

    [Test]
    public void VisitHiCheckout_GivenTournamentFixture_AddsOneScore()
    {
        _visitor.VisitHiCheckout(TournamentVisitorScope, HiCheckPlayer);

        AssertPlayerIds(_divisionData.Players, HiCheckPlayer);
        var player1Scores = _divisionData.Players[HiCheckPlayer.Id];
        Assert.That(player1Scores.HiCheckout, Is.EqualTo(120));
    }

    [Test]
    public void VisitHiCheckout_GivenPlayerWithNewHiCheckWithTrailingWhitespace_AddsOneScore()
    {
        var homePlayer1 = new NotablePlayer
        {
            Id = HomeTeamPlayer.Id,
            Notes = "120  ",
        };

        _visitor.VisitHiCheckout(LeagueVisitorScope, homePlayer1);

        AssertPlayerIds(_divisionData.Players, homePlayer1);
        var player1Scores = _divisionData.Players[homePlayer1.Id];
        Assert.That(player1Scores.HiCheckout, Is.EqualTo(120));
    }

    [Test]
    public void VisitHiCheckout_GivenPlayerWithLowerHiCheckThanPrevious_IgnoresScore()
    {
        _visitor.VisitHiCheckout(LeagueVisitorScope, new NotablePlayer
        {
            Id = HomeTeamPlayer.Id,
            Notes = "120",
        });
        _visitor.VisitHiCheckout(LeagueVisitorScope, new NotablePlayer
        {
            Id = HomeTeamPlayer.Id,
            Notes = "110",
        });

        Assert.That(_divisionData.Players.Keys, Is.EquivalentTo(new[] { HomeTeamPlayer.Id }));
        var player1Scores = _divisionData.Players[HomeTeamPlayer.Id];
        Assert.That(player1Scores.HiCheckout, Is.EqualTo(120));
    }

    [Test]
    public void VisitHiCheckout_GivenPlayerWithNonNumericScore_IgnoresScore()
    {
        _visitor.VisitHiCheckout(LeagueVisitorScope, new NotablePlayer
        {
            Id = HomeTeamPlayer.Id,
            Notes = "wibble",
        });

        Assert.That(_divisionData.Players.Keys, Is.Empty);
    }

    [Test]
    public void VisitTeam_GivenPlayedKnockoutGame_IgnoresTeam()
    {
        _visitor.VisitTeam(KnockoutVisitorScope, HomeTeam, GameState.Played);

        Assert.That(_divisionData.Teams.Keys, Is.Empty);
    }

    [Test]
    public void VisitTeam_WhenScoresObscured_IgnoresTeam()
    {
        _visitor.VisitTeam(VetoedVisitorScope, HomeTeam, GameState.Played);

        Assert.That(_divisionData.Teams.Keys, Is.Empty);
    }

    [Test]
    public void VisitTeam_GivenUnPlayedGame_IgnoresTeam()
    {
        _visitor.VisitTeam(LeagueVisitorScope, HomeTeam, GameState.Pending);

        Assert.That(_divisionData.Teams.Keys, Is.Empty);
    }

    [Test]
    public void VisitTeam_GivenPlayedGame_RecordsTeamWithGamePlayed()
    {
        _visitor.VisitTeam(LeagueVisitorScope, HomeTeam, GameState.Played);

        AssertTeamIds(_divisionData.Teams, HomeTeam);
        Assert.That(_divisionData.Teams[HomeTeam.Id].FixturesPlayed, Is.EqualTo(1));
    }

    [Test]
    public void VisitTeam_GivenSubsequentPlayedGame_RecordsTeamWithAnotherGamePlayed()
    {
        _visitor.VisitTeam(LeagueVisitorScope, HomeTeam, GameState.Played);
        _visitor.VisitTeam(LeagueVisitorScope, HomeTeam, GameState.Played);

        AssertTeamIds(_divisionData.Teams, HomeTeam);
        Assert.That(_divisionData.Teams[HomeTeam.Id].FixturesPlayed, Is.EqualTo(2));
    }

    [Test]
    public void VisitGameDraw_GivenTeams_RecordsDrawForBothTeams()
    {
        _visitor.VisitGameDraw(LeagueVisitorScope, HomeTeam, AwayTeam);

        AssertTeamIds(_divisionData.Teams, HomeTeam, AwayTeam);
        Assert.That(_divisionData.Teams[HomeTeam.Id].FixturesDrawn, Is.EqualTo(1));
        Assert.That(_divisionData.Teams[AwayTeam.Id].FixturesDrawn, Is.EqualTo(1));
    }

    [Test]
    public void VisitGameDraw_WhenScoresObscured_DoesNotRecordDrawForEitherTeam()
    {
        _visitor.VisitGameDraw(VetoedVisitorScope, HomeTeam, AwayTeam);

        AssertTeamIds(_divisionData.Teams);
    }

    [Test]
    public void VisitGameDraw_GivenKnockoutFixture_RecordsDrawForBothTeams()
    {
        _visitor.VisitGameDraw(KnockoutVisitorScope, HomeTeam, AwayTeam);

        Assert.That(_divisionData.Teams, Is.Empty);
    }

    [Test]
    public void VisitGameWinner_WhenScoresObscured_DoesNotRecordWin()
    {
        _visitor.VisitGameWinner(VetoedVisitorScope, HomeTeam);

        AssertTeamIds(_divisionData.Teams);
    }

    [Test]
    public void VisitGameWinner_GivenTeam_RecordsFixtureWon()
    {
        _visitor.VisitGameWinner(LeagueVisitorScope, HomeTeam);

        AssertTeamIds(_divisionData.Teams, HomeTeam);
        Assert.That(_divisionData.Teams[HomeTeam.Id].FixturesWon, Is.EqualTo(1));
    }

    [Test]
    public void VisitGameWinner_GivenKnockoutFixture_RecordsFixtureWon()
    {
        _visitor.VisitGameWinner(KnockoutVisitorScope, HomeTeam);

        Assert.That(_divisionData.Teams, Is.Empty);
    }

    [Test]
    public void VisitGameLoser_WhenScoresObscured_DoesNotRecordFixtureLost()
    {
        _visitor.VisitGameLoser(VetoedVisitorScope, HomeTeam);

        AssertTeamIds(_divisionData.Teams);
    }

    [Test]
    public void VisitGameLoser_GivenTeam_RecordsFixtureLost()
    {
        _visitor.VisitGameLoser(LeagueVisitorScope, HomeTeam);

        AssertTeamIds(_divisionData.Teams, HomeTeam);
        Assert.That(_divisionData.Teams[HomeTeam.Id].FixturesLost, Is.EqualTo(1));
    }

    [Test]
    public void VisitGameLoser_GivenKnockoutFixture_RecordsFixtureLost()
    {
        _visitor.VisitGameLoser(KnockoutVisitorScope, HomeTeam);

        Assert.That(_divisionData.Teams, Is.Empty);
    }

    private static void AssertPlayerIds(IDictionary<Guid, DivisionData.PlayerScore> actual, params GamePlayer[] expected)
    {
        Assert.That(actual.Keys, Is.EquivalentTo(expected.Select(p => p.Id)));
    }

    private static void AssertTeamIds(IDictionary<Guid, DivisionData.TeamScore> actual, params GameTeam[] expected)
    {
        Assert.That(actual.Keys, Is.EquivalentTo(expected.Select(p => p.Id)));
    }
}