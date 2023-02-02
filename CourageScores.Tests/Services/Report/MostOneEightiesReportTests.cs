using CourageScores.Models.Cosmos.Game;
using CourageScores.Services.Report;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class MostOneEightiesReportTests
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
        var report = new MostOneEightiesReport(topCount: 3);

        var result = await report.GetReport(_playerLookup.Object);

        Assert.That(result.Rows, Is.Empty);
    }

    [Test]
    public async Task GetReport_GivenOneEightyTwice_ReturnsRowOnce()
    {
        var report = new MostOneEightiesReport(topCount: 3);
        report.VisitOneEighty(new GamePlayer { Id = _jonId });
        report.VisitOneEighty(new GamePlayer { Id = _jonId });

        var result = await report.GetReport(_playerLookup.Object);

        Assert.That(result.Rows.Select(r => r.PlayerId), Is.EquivalentTo(new[] { _jonId }));
        Assert.That(result.Rows.Select(r => r.PlayerName), Is.EquivalentTo(new[] { _jon.PlayerName }));
        Assert.That(result.Rows.Select(r => r.TeamId), Is.EquivalentTo(new[] { _jon.TeamId }));
        Assert.That(result.Rows.Select(r => r.TeamName), Is.EquivalentTo(new[] { _jon.TeamName }));
        Assert.That(result.Rows.Select(r => r.Value), Is.EquivalentTo(new[] { 2 }));
    }

    [Test]
    public async Task GetReport_GivenDifferentPlayersScoreOneEighty_ReturnsRowOnce()
    {
        var report = new MostOneEightiesReport(topCount: 3);
        report.VisitOneEighty(new GamePlayer { Id = _jonId });
        report.VisitOneEighty(new GamePlayer { Id = _daveId });

        var result = await report.GetReport(_playerLookup.Object);

        Assert.That(result.Rows.Select(r => r.PlayerId), Is.EquivalentTo(new[] { _jonId, _daveId }));
        Assert.That(result.Rows.Select(r => r.PlayerName), Is.EquivalentTo(new[] { _jon.PlayerName, _dave.PlayerName }));
        Assert.That(result.Rows.Select(r => r.TeamId), Is.EquivalentTo(new[] { _jon.TeamId, _dave.TeamId }));
        Assert.That(result.Rows.Select(r => r.TeamName), Is.EquivalentTo(new[] { _jon.TeamName, _dave.TeamName }));
        Assert.That(result.Rows.Select(r => r.Value), Is.EquivalentTo(new[] { 1, 1 }));
    }

    [Test]
    public async Task GetReport_GivenMoreOneEightyPlayersThanLimit_ReturnsAtMostRowCount()
    {
        var report = new MostOneEightiesReport(topCount: 2);
        report.VisitOneEighty(new GamePlayer { Id = _jonId });
        report.VisitOneEighty(new GamePlayer { Id = _jonId });
        report.VisitOneEighty(new GamePlayer { Id = _daveId });
        report.VisitOneEighty(new GamePlayer { Id = _daveId });
        report.VisitOneEighty(new GamePlayer { Id = Guid.NewGuid() });

        var result = await report.GetReport(_playerLookup.Object);

        Assert.That(result.Rows.Select(r => r.PlayerId), Is.EquivalentTo(new[] { _jonId, _daveId }));
        Assert.That(result.Rows.Select(r => r.PlayerName), Is.EquivalentTo(new[] { _jon.PlayerName, _dave.PlayerName }));
        Assert.That(result.Rows.Select(r => r.TeamId), Is.EquivalentTo(new[] { _jon.TeamId, _dave.TeamId }));
        Assert.That(result.Rows.Select(r => r.TeamName), Is.EquivalentTo(new[] { _jon.TeamName, _dave.TeamName }));
        Assert.That(result.Rows.Select(r => r.Value), Is.EquivalentTo(new[] { 2, 2 }));
    }
}