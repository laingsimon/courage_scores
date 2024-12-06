using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Division;

public static class DivisionDataGameVisitorTestHelpers
{
    public static GamePlayer GamePlayer(string name)
    {
        return new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = name,
        };
    }

    public static TeamPlayerDto TeamPlayerDto(GamePlayer player)
    {
        return new TeamPlayerDto
        {
            Id = player.Id,
            Name = player.Name,
        };
    }

    public static void AssertScoreIsEqual(
        this DivisionData.PlayerPlayScore score,
        int? matchesWon = null,
        int? matchesLost = null,
        int? matchesPlayed = null,
        int? playerWinRate = null,
        int? playerLossRate = null,
        int? teamWinRate = null,
        int? teamLossRate = null)
    {
        if (matchesWon != null)
        {
            Assert.That(score.MatchesWon, Is.EqualTo(matchesWon), "Matches won");
        }

        if (matchesLost != null)
        {
            Assert.That(score.MatchesLost, Is.EqualTo(matchesLost), "Matches lost");
        }

        if (matchesPlayed != null)
        {
            Assert.That(score.MatchesPlayed, Is.EqualTo(matchesPlayed), "Matches played");
        }

        if (playerWinRate != null)
        {
            Assert.That(score.PlayerWinRate, Is.EqualTo(playerWinRate), "Player WinRate");
        }

        if (playerLossRate != null)
        {
            Assert.That(score.PlayerLossRate, Is.EqualTo(playerLossRate), "Player Loss Rate");
        }

        if (teamWinRate != null)
        {
            Assert.That(score.TeamWinRate, Is.EqualTo(teamWinRate), "Team WinRate");
        }

        if (teamLossRate != null)
        {
            Assert.That(score.TeamLossRate, Is.EqualTo(teamLossRate), "Team Loss Rate");
        }
    }
}