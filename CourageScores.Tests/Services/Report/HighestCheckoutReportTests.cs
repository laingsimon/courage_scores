using CourageScores.Models.Cosmos.Game;
using CourageScores.Services.Report;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class HighestCheckoutReportTests
{
    private readonly Guid _daveId = Guid.NewGuid();
    private readonly Guid _jonId = Guid.NewGuid();
    private readonly PlayerDetails _dave = new PlayerDetails { PlayerName = "Dave", TeamName = "TEAM1", TeamId = Guid.NewGuid(), };
    private readonly PlayerDetails _jon = new PlayerDetails { PlayerName = "Jon", TeamName = "TEAM2", TeamId = Guid.NewGuid(), };
    private Mock<IPlayerLookup> _playerLookup = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _playerLookup = new Mock<IPlayerLookup>();
        _playerLookup.Setup(l => l.GetPlayer(_daveId)).ReturnsAsync(_dave);
        _playerLookup.Setup(l => l.GetPlayer(_jonId)).ReturnsAsync(_jon);
        _playerLookup.Setup(l => l.GetPlayer(It.Is<Guid>(id => id != _daveId && id != _jonId)))
            .ReturnsAsync(() => new PlayerDetails());
    }

    [Test]
    public async Task GetReport_GivenNoPlayers_ReturnsNoRows()
    {
        var report = new HighestCheckoutReport(topCount: 3);

        var result = await report.GetReport(_playerLookup.Object);

        Assert.That(result.Rows, Is.Empty);
    }

    [Test]
    public async Task GetReport_GivenNonNumericalNotes_ReturnsNoRows()
    {
        var report = new HighestCheckoutReport(topCount: 3);
        report.VisitHiCheckout(new NotablePlayer { Id = _daveId, Notes = "" });
        report.VisitHiCheckout(new NotablePlayer { Id = _daveId, Notes = null });
        report.VisitHiCheckout(new NotablePlayer { Id = _daveId, Notes = "abcd" });

        var result = await report.GetReport(_playerLookup.Object);

        Assert.That(result.Rows, Is.Empty);
    }

    [Test]
    public async Task GetReport_GivenSamePlayerWithDifferentHiChecks_ReturnsRowWithGreatestCheckout()
    {
        var report = new HighestCheckoutReport(topCount: 3);
        report.VisitHiCheckout(new NotablePlayer { Id = _daveId, Notes = "100" });
        report.VisitHiCheckout(new NotablePlayer { Id = _daveId, Notes = "110" });

        var result = await report.GetReport(_playerLookup.Object);

        Assert.That(result.Rows.Select(r => r.PlayerName), Is.EquivalentTo(new[] { _dave.PlayerName }));
        Assert.That(result.Rows.Select(r => r.TeamName), Is.EquivalentTo(new[] { _dave.TeamName }));
        Assert.That(result.Rows.Select(r => r.Value), Is.EquivalentTo(new[] { 110d }));
        Assert.That(result.Rows.Select(r => r.PlayerId), Is.EquivalentTo(new[] { _daveId }));
        Assert.That(result.Rows.Select(r => r.TeamId), Is.EquivalentTo(new[] { _dave.TeamId }));
    }

    [Test]
    public async Task GetReport_GivenTwoPlayersWithSameHiChecks_ReturnsBothPlayers()
    {
        var report = new HighestCheckoutReport(topCount: 3);
        report.VisitHiCheckout(new NotablePlayer { Id = _daveId, Notes = "100" });
        report.VisitHiCheckout(new NotablePlayer { Id = _jonId, Notes = "100" });

        var result = await report.GetReport(_playerLookup.Object);

        Assert.That(result.Rows.Select(r => r.PlayerName), Is.EquivalentTo(new[] { _dave.PlayerName, _jon.PlayerName }));
        Assert.That(result.Rows.Select(r => r.TeamName), Is.EquivalentTo(new[] { _dave.TeamName, _jon.TeamName }));
        Assert.That(result.Rows.Select(r => r.Value), Is.EquivalentTo(new[] { 100d, 100d }));
        Assert.That(result.Rows.Select(r => r.PlayerId), Is.EquivalentTo(new[] { _daveId, _jonId }));
        Assert.That(result.Rows.Select(r => r.TeamId), Is.EquivalentTo(new[] { _dave.TeamId, _jon.TeamId }));
    }

    [Test]
    public async Task GetReport_GivenMorePlayerHiChecksThanLimit_ReturnsNoMoreRowsThanLimit()
    {
        var report = new HighestCheckoutReport(topCount: 2);
        report.VisitHiCheckout(new NotablePlayer { Id = _daveId, Notes = "103" });
        report.VisitHiCheckout(new NotablePlayer { Id = _jonId, Notes = "102" });
        report.VisitHiCheckout(new NotablePlayer { Id = Guid.NewGuid(), Notes = "101" });

        var result = await report.GetReport(_playerLookup.Object);

        Assert.That(result.Rows.Select(r => r.PlayerName), Is.EquivalentTo(new[] { _dave.PlayerName, _jon.PlayerName }));
        Assert.That(result.Rows.Select(r => r.TeamName), Is.EquivalentTo(new[] { _dave.TeamName, _jon.TeamName }));
        Assert.That(result.Rows.Select(r => r.Value), Is.EquivalentTo(new[] { 103d, 102d }));
        Assert.That(result.Rows.Select(r => r.PlayerId), Is.EquivalentTo(new[] { _daveId, _jonId }));
        Assert.That(result.Rows.Select(r => r.TeamId), Is.EquivalentTo(new[] { _dave.TeamId, _jon.TeamId }));
    }
}