using CourageScores.Models.Dtos.Division;
using CourageScores.Services.Division;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionServiceExtensionsTests
{
    [Test]
    public void ApplyPlayerRanks_WhenCalled_SetsRanksCorrectly()
    {
        var playerA = new DivisionPlayerDto { Name = "a" };
        var playerB = new DivisionPlayerDto { Name = "b" };
        var playerC = new DivisionPlayerDto { Name = "c" };
        var players = new List<DivisionPlayerDto> { playerA, playerB, playerC };

        // ReSharper disable once ReturnValueOfPureMethodIsNotUsed
        players.OrderBy(p => p.Name).ApplyRanks().ToList();

        Assert.That(playerA.Rank, Is.EqualTo(1));
        Assert.That(playerB.Rank, Is.EqualTo(2));
        Assert.That(playerC.Rank, Is.EqualTo(3));
    }

    [Test]
    public void ApplyPlayerRanks_WhenCalled_ReturnsAllPlayersInCorrectOrder()
    {
        var playerA = new DivisionPlayerDto { Name = "a" };
        var playerB = new DivisionPlayerDto { Name = "b" };
        var playerC = new DivisionPlayerDto { Name = "c" };
        var players = new List<DivisionPlayerDto> { playerA, playerB, playerC };

        var result = players.OrderBy(p => p.Name).ApplyRanks().ToList();

        Assert.That(result, Is.EqualTo(players));
    }
}