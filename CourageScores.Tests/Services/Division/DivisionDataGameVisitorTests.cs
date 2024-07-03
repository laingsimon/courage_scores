using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using CourageScores.Tests.Models.Cosmos.Game;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionDataGameVisitorTests
{
    private static readonly Guid SeasonId = Guid.NewGuid();
    private static readonly TeamPlayerDto HomePlayer = new()
    {
        Id = Guid.NewGuid(),
        Name = "home_player",
    };
    private static readonly TeamPlayerDto AwayPlayer = new()
    {
        Id = Guid.NewGuid(),
        Name = "away_player",
    };
    private static readonly TeamDto Home = new()
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
                    HomePlayer,
                },
            },
        },
    };
    private static readonly TeamDto Away = new()
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
                    AwayPlayer,
                },
            },
        },
    };
    private static readonly IVisitorScope LeagueVisitorScope = new VisitorScope
    {
        Game = new CosmosGame
        {
            IsKnockout = false,
        },
    };
    private static readonly IVisitorScope KnockoutVisitorScope = new VisitorScope
    {
        Game = new CosmosGame
        {
            IsKnockout = true,
        },
    };
    private static readonly IVisitorScope TournamentVisitorScope = new VisitorScope
    {
        Tournament = new TournamentGame(),
    };
    private static readonly GamePlayer HomePlayer1 = new GamePlayer
    {
        Id = HomePlayer.Id,
    };
    private static readonly GamePlayer HomePlayer2 = new GamePlayer
    {
        Id = Guid.NewGuid(),
    };
    private static readonly GamePlayer AwayPlayer1 = new GamePlayer
    {
        Id = AwayPlayer.Id,
    };
    // hi-check
    private static readonly NotablePlayer HiCheckPlayer = new NotablePlayer
    {
        Id = HomePlayer.Id,
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

    [Test]
    public void VisitDataError_AddsError()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitDataError(LeagueVisitorScope, "some error");

        Assert.That(divisionData.DataErrors.Select(de => de.Message), Has.Member("some error"));
    }

    [Test]
    public void VisitGame_GivenPostponedGame_IgnoresData()
    {
        var divisionData = new DivisionData();
        var game = new GameBuilder()
            .Postponed()
            .ForSeason(SeasonId)
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Home, Away)
            .WithMatch(m => m.WithHomePlayers(HomePlayer.Id).WithAwayPlayers(AwayPlayer.Id))
            .Build();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitGame(game);

        Assert.That(divisionData.PlayersToFixtures, Is.Empty);
    }

    [Test]
    public void VisitGame_GivenGame_AddsPlayersIntoGameToPlayerLookup()
    {
        var divisionData = new DivisionData();
        var game = new GameBuilder()
            .ForSeason(SeasonId)
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Home, Away)
            .WithMatch(m => m.WithHomePlayers(HomePlayer1).WithAwayPlayers(AwayPlayer1))
            .Build();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitGame(game);

        var mapping = divisionData.PlayersToFixtures;
        Assert.That(mapping.Keys, Is.EquivalentTo(new[]
        {
            HomePlayer.Id, AwayPlayer.Id,
        }));
        Assert.That(mapping[HomePlayer.Id].Keys, Is.EquivalentTo(new[]
        {
            game.Date,
        }));
        Assert.That(mapping[AwayPlayer.Id].Keys, Is.EquivalentTo(new[]
        {
            game.Date,
        }));
        Assert.That(mapping[HomePlayer.Id][game.Date], Is.EqualTo(game.Id));
        Assert.That(mapping[AwayPlayer.Id][game.Date], Is.EqualTo(game.Id));
    }

    [Test]
    public void VisitMatchWin_GivenKnockoutFixture_DoesNothing()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitMatchWin(KnockoutVisitorScope, new[]
        {
            HomePlayer1, HomePlayer2,
        }, TeamDesignation.Home, 3, 2);

        Assert.That(divisionData.Players, Is.Empty);
    }

    [Test]
    public void VisitMatchWin_GivenSomePlayers_RecordsPlayerWinRateForAllPlayers()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitMatchWin(LeagueVisitorScope, new[]
        {
            HomePlayer1, HomePlayer2,
        }, TeamDesignation.Home, 3, 2);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            HomePlayer1.Id, HomePlayer2.Id,
        }));
        var player1Scores = divisionData.Players[HomePlayer1.Id];
        var player2Scores = divisionData.Players[HomePlayer2.Id];
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
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitMatchWin(LeagueVisitorScope, new[]
        {
            HomePlayer1, HomePlayer2,
        }, TeamDesignation.Home, 3, 2);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            HomePlayer1.Id, HomePlayer2.Id,
        }));
        var player1Scores = divisionData.Players[HomePlayer1.Id];
        var player2Scores = divisionData.Players[HomePlayer2.Id];
        Assert.That(player1Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(3));
        Assert.That(player1Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(2));
        Assert.That(player2Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(0));
        Assert.That(player2Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(0));
    }

    [Test]
    public void VisitMatchWin_GivenDifferingNumberOfPlayers_RecordsScoresAgainstCorrectNumberOfPlayers()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitMatchWin(LeagueVisitorScope, new[]
        {
            HomePlayer1, HomePlayer2,
        }, TeamDesignation.Home, 3, 2);
        visitor.VisitMatchWin(LeagueVisitorScope, new[]
        {
            HomePlayer1,
        }, TeamDesignation.Home, 3, 1);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            HomePlayer1.Id, HomePlayer2.Id,
        }));
        var player1Scores = divisionData.Players[HomePlayer1.Id];
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
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitMatchLost(LeagueVisitorScope, new[]
        {
            HomePlayer1, HomePlayer2,
        }, TeamDesignation.Home, 2, 3);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            HomePlayer1.Id, HomePlayer2.Id,
        }));
        var player1Scores = divisionData.Players[HomePlayer1.Id];
        var player2Scores = divisionData.Players[HomePlayer2.Id];
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
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitMatchLost(KnockoutVisitorScope, new[]
        {
            HomePlayer1, HomePlayer2,
        }, TeamDesignation.Home, 2, 3);

        Assert.That(divisionData.Players, Is.Empty);
    }

    [Test]
    public void VisitMatchLost_GivenSomePlayers_RecordsPlayerTeamRateForFirstPlayerOnly()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitMatchLost(LeagueVisitorScope, new[]
        {
            HomePlayer1, HomePlayer2,
        }, TeamDesignation.Home, 2, 3);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            HomePlayer1.Id, HomePlayer2.Id,
        }));
        var player1Scores = divisionData.Players[HomePlayer1.Id];
        var player2Scores = divisionData.Players[HomePlayer2.Id];
        Assert.That(player1Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(2));
        Assert.That(player1Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(3));
        Assert.That(player2Scores.PlayerPlayCount[2].TeamWinRate, Is.EqualTo(0));
        Assert.That(player2Scores.PlayerPlayCount[2].TeamLossRate, Is.EqualTo(0));
    }

    [Test]
    public void VisitMatchLost_GivenDifferingNumberOfPlayers_RecordsScoresAgainstCorrectNumberOfPlayers()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitMatchLost(LeagueVisitorScope, new[]
        {
            HomePlayer1, HomePlayer2,
        }, TeamDesignation.Home, 2, 3);
        visitor.VisitMatchLost(LeagueVisitorScope, new[]
        {
            HomePlayer1,
        }, TeamDesignation.Home, 1, 3);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            HomePlayer1.Id, HomePlayer2.Id,
        }));
        var player1Scores = divisionData.Players[HomePlayer1.Id];
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
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitOneEighty(LeagueVisitorScope, HomePlayer1);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            HomePlayer1.Id,
        }));
        var player1Scores = divisionData.Players[HomePlayer1.Id];
        Assert.That(player1Scores.OneEighties, Is.EqualTo(1));
    }

    [Test]
    public void VisitOneEighty_GivenKnockoutFixture_AddsOneEighty()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitOneEighty(KnockoutVisitorScope, HomePlayer1);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            HomePlayer1.Id,
        }));
        var player1Scores = divisionData.Players[HomePlayer1.Id];
        Assert.That(player1Scores.OneEighties, Is.EqualTo(1));
    }

    [Test]
    public void VisitOneEighty_GivenTournamentFixture_AddsOneEighty()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitOneEighty(TournamentVisitorScope, HomePlayer1);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            HomePlayer1.Id,
        }));
        var player1Scores = divisionData.Players[HomePlayer1.Id];
        Assert.That(player1Scores.OneEighties, Is.EqualTo(1));
    }

    [Test]
    public void VisitHiCheckout_GivenPlayerWithNewHiCheck_AddsOneScore()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitHiCheckout(LeagueVisitorScope, HiCheckPlayer);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            HiCheckPlayer.Id,
        }));
        var player1Scores = divisionData.Players[HiCheckPlayer.Id];
        Assert.That(player1Scores.HiCheckout, Is.EqualTo(120));
    }

    [Test]
    public void VisitHiCheckout_GivenKnockoutFixture_AddsOneScore()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitHiCheckout(KnockoutVisitorScope, HiCheckPlayer);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            HiCheckPlayer.Id,
        }));
        var player1Scores = divisionData.Players[HiCheckPlayer.Id];
        Assert.That(player1Scores.HiCheckout, Is.EqualTo(120));
    }

    [Test]
    public void VisitHiCheck_GivenTournamentFixture_AddsOneScore()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitHiCheckout(TournamentVisitorScope, HiCheckPlayer);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            HiCheckPlayer.Id,
        }));
        var player1Scores = divisionData.Players[HiCheckPlayer.Id];
        Assert.That(player1Scores.HiCheckout, Is.EqualTo(120));
    }

    [Test]
    public void VisitHiCheckout_GivenPlayerWithNewHiCheckWithTrailingWhitespace_AddsOneScore()
    {
        var divisionData = new DivisionData();
        var homePlayer1 = new NotablePlayer
        {
            Id = HomePlayer.Id,
            Notes = "120  ",
        };
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitHiCheckout(LeagueVisitorScope, homePlayer1);

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            homePlayer1.Id,
        }));
        var player1Scores = divisionData.Players[homePlayer1.Id];
        Assert.That(player1Scores.HiCheckout, Is.EqualTo(120));
    }

    [Test]
    public void VisitHiCheckout_GivenPlayerWithLowerHiCheckThanPrevious_IgnoresScore()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitHiCheckout(LeagueVisitorScope, new NotablePlayer
        {
            Id = HomePlayer.Id,
            Notes = "120",
        });
        visitor.VisitHiCheckout(LeagueVisitorScope, new NotablePlayer
        {
            Id = HomePlayer.Id,
            Notes = "110",
        });

        Assert.That(divisionData.Players.Keys, Is.EquivalentTo(new[]
        {
            HomePlayer.Id,
        }));
        var player1Scores = divisionData.Players[HomePlayer.Id];
        Assert.That(player1Scores.HiCheckout, Is.EqualTo(120));
    }

    [Test]
    public void VisitHiCheckout_GivenPlayerWithNonNumericScore_IgnoresScore()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitHiCheckout(LeagueVisitorScope, new NotablePlayer
        {
            Id = HomePlayer.Id,
            Notes = "wibble",
        });

        Assert.That(divisionData.Players.Keys, Is.Empty);
    }

    [Test]
    public void VisitTeam_GivenPlayedKnockoutGame_IgnoresTeam()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitTeam(KnockoutVisitorScope, HomeTeam, GameState.Played);

        Assert.That(divisionData.Teams.Keys, Is.Empty);
    }

    [Test]
    public void VisitTeam_GivenUnPlayedGame_IgnoresTeam()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitTeam(LeagueVisitorScope, HomeTeam, GameState.Pending);

        Assert.That(divisionData.Teams.Keys, Is.Empty);
    }

    [Test]
    public void VisitTeam_GivenPlayedGame_RecordsTeamWithGamePlayed()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitTeam(LeagueVisitorScope, HomeTeam, GameState.Played);

        Assert.That(divisionData.Teams.Keys, Is.EquivalentTo(new[]
        {
            HomeTeam.Id,
        }));
        Assert.That(divisionData.Teams[HomeTeam.Id].FixturesPlayed, Is.EqualTo(1));
    }

    [Test]
    public void VisitTeam_GivenSubsequentPlayedGame_RecordsTeamWithAnotherGamePlayed()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitTeam(LeagueVisitorScope, HomeTeam, GameState.Played);
        visitor.VisitTeam(LeagueVisitorScope, HomeTeam, GameState.Played);

        Assert.That(divisionData.Teams.Keys, Is.EquivalentTo(new[]
        {
            HomeTeam.Id,
        }));
        Assert.That(divisionData.Teams[HomeTeam.Id].FixturesPlayed, Is.EqualTo(2));
    }

    [Test]
    public void VisitGameDraw_GivenTeams_RecordsDrawForBothTeams()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitGameDraw(LeagueVisitorScope, HomeTeam, AwayTeam);

        Assert.That(divisionData.Teams.Keys, Is.EquivalentTo(new[]
        {
            HomeTeam.Id, AwayTeam.Id,
        }));
        Assert.That(divisionData.Teams[HomeTeam.Id].FixturesDrawn, Is.EqualTo(1));
        Assert.That(divisionData.Teams[AwayTeam.Id].FixturesDrawn, Is.EqualTo(1));
    }

    [Test]
    public void VisitGameDraw_GivenKnockoutFixture_RecordsDrawForBothTeams()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitGameDraw(KnockoutVisitorScope, HomeTeam, AwayTeam);

        Assert.That(divisionData.Teams, Is.Empty);
    }

    [Test]
    public void VisitGameWinner_GivenTeam_RecordsFixtureWon()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitGameWinner(LeagueVisitorScope, HomeTeam);

        Assert.That(divisionData.Teams.Keys, Is.EquivalentTo(new[]
        {
            HomeTeam.Id,
        }));
        Assert.That(divisionData.Teams[HomeTeam.Id].FixturesWon, Is.EqualTo(1));
    }

    [Test]
    public void VisitGameWinner_GivenKnockoutFixture_RecordsFixtureWon()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitGameWinner(KnockoutVisitorScope, HomeTeam);

        Assert.That(divisionData.Teams, Is.Empty);
    }

    [Test]
    public void VisitGameLoser_GivenTeam_RecordsFixtureWon()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitGameLoser(LeagueVisitorScope, HomeTeam);

        Assert.That(divisionData.Teams.Keys, Is.EquivalentTo(new[]
        {
            HomeTeam.Id,
        }));
        Assert.That(divisionData.Teams[HomeTeam.Id].FixturesLost, Is.EqualTo(1));
    }

    [Test]
    public void VisitGameLoser_GivenKnockoutFixture_RecordsFixtureWon()
    {
        var divisionData = new DivisionData();
        var visitor = new DivisionDataGameVisitor(divisionData);

        visitor.VisitGameLoser(KnockoutVisitorScope, HomeTeam);

        Assert.That(divisionData.Teams, Is.Empty);
    }
}