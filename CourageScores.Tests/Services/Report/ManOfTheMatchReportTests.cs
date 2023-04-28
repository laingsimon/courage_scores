using CourageScores.Services.Report;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class ManOfTheMatchReportTests
{
    private readonly CancellationToken _token = new CancellationToken();
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
        var report = new ManOfTheMatchReport(topCount: 3);

        var result = await report.GetReport(_playerLookup.Object, _token);

        Assert.That(result.Rows, Is.Empty);
    }

    [Test]
    public async Task GetReport_GivenEmptyManOfTheMatch_ReturnsNoRows()
    {
        var report = new ManOfTheMatchReport(topCount: 3);
        report.VisitManOfTheMatch(null);

        var result = await report.GetReport(_playerLookup.Object, _token);

        Assert.That(result.Rows, Is.Empty);
    }

    [Test]
    public async Task GetReport_GivenManOfTheMatchTwice_ReturnsRowOnce()
    {
        var report = new ManOfTheMatchReport(topCount: 3);
        report.VisitManOfTheMatch(_jonId);
        report.VisitManOfTheMatch(_jonId);

        var result = await report.GetReport(_playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.PlayerId), Is.EquivalentTo(new[] { _jonId }));
        Assert.That(result.Rows.Select(r => r.PlayerName), Is.EquivalentTo(new[] { _jon.PlayerName }));
        Assert.That(result.Rows.Select(r => r.TeamId), Is.EquivalentTo(new[] { _jon.TeamId }));
        Assert.That(result.Rows.Select(r => r.TeamName), Is.EquivalentTo(new[] { _jon.TeamName }));
        Assert.That(result.Rows.Select(r => r.Value), Is.EquivalentTo(new[] { 2 }));
    }

    [Test]
    public async Task GetReport_GivenDifferentManOfTheMatch_ReturnsBothRows()
    {
        var report = new ManOfTheMatchReport(topCount: 3);
        report.VisitManOfTheMatch(_jonId);
        report.VisitManOfTheMatch(_daveId);

        var result = await report.GetReport(_playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.PlayerId), Is.EquivalentTo(new[] { _jonId, _daveId }));
        Assert.That(result.Rows.Select(r => r.PlayerName), Is.EquivalentTo(new[] { _jon.PlayerName, _dave.PlayerName }));
        Assert.That(result.Rows.Select(r => r.TeamId), Is.EquivalentTo(new[] { _jon.TeamId, _dave.TeamId }));
        Assert.That(result.Rows.Select(r => r.TeamName), Is.EquivalentTo(new[] { _jon.TeamName, _dave.TeamName }));
        Assert.That(result.Rows.Select(r => r.Value), Is.EquivalentTo(new[] { 1, 1 }));
    }

    [Test]
    public async Task GetReport_GivenMoreManOfTheMatchResultsThanLimit_ReturnsNoMoreThanLimitRows()
    {
        var report = new ManOfTheMatchReport(topCount: 2);
        report.VisitManOfTheMatch(_jonId);
        report.VisitManOfTheMatch(_jonId);
        report.VisitManOfTheMatch(_daveId);
        report.VisitManOfTheMatch(_daveId);
        report.VisitManOfTheMatch(Guid.NewGuid());

        var result = await report.GetReport(_playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.PlayerId), Is.EquivalentTo(new[] { _jonId, _daveId }));
        Assert.That(result.Rows.Select(r => r.PlayerName), Is.EquivalentTo(new[] { _jon.PlayerName, _dave.PlayerName }));
        Assert.That(result.Rows.Select(r => r.TeamId), Is.EquivalentTo(new[] { _jon.TeamId, _dave.TeamId }));
        Assert.That(result.Rows.Select(r => r.TeamName), Is.EquivalentTo(new[] { _jon.TeamName, _dave.TeamName }));
        Assert.That(result.Rows.Select(r => r.Value), Is.EquivalentTo(new[] { 2, 2 }));
    }
}