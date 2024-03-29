﻿using CourageScores.Models.Cosmos.Game;
using CourageScores.Services.Report;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class MostOneEightiesReportTests
{
    private readonly CancellationToken _token = new();
    private readonly Guid _daveId = Guid.NewGuid();
    private readonly Guid _jonId = Guid.NewGuid();
    private readonly PlayerDetails _dave = new()
    {
        PlayerName = "Dave",
        TeamName = "TEAM1",
        TeamId = Guid.NewGuid(),
    };
    private readonly PlayerDetails _jon = new()
    {
        PlayerName = "Jon",
        TeamName = "TEAM2",
        TeamId = Guid.NewGuid(),
    };
    private Mock<IPlayerLookup> _playerLookup = null!;
    private static readonly IVisitorScope VisitorScope = new VisitorScope();

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

        var result = await report.GetReport(_playerLookup.Object, _token);

        Assert.That(result.Rows, Is.Empty);
    }

    [Test]
    public async Task GetReport_GivenOneEightyTwice_ReturnsRowOnce()
    {
        var report = new MostOneEightiesReport(topCount: 3);
        report.VisitOneEighty(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        });
        report.VisitOneEighty(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        });

        var result = await report.GetReport(_playerLookup.Object, _token);

        result.AssertPlayerLinks(
            1,
            new ReportTestingExtensions.PlayerLink(_jon, _jonId));
        result.AssertTeamLinks(
            0,
            new ReportTestingExtensions.TeamLink(_jon));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "2",
        }));
    }

    [Test]
    public async Task GetReport_GivenDifferentPlayersScoreOneEighty_ReturnsRowOnce()
    {
        var report = new MostOneEightiesReport(topCount: 3);
        report.VisitOneEighty(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        });
        report.VisitOneEighty(VisitorScope, new GamePlayer
        {
            Id = _daveId,
        });

        var result = await report.GetReport(_playerLookup.Object, _token);

        result.AssertPlayerLinks(
            1,
            new ReportTestingExtensions.PlayerLink(_jon, _jonId),
            new ReportTestingExtensions.PlayerLink(_dave, _daveId));
        result.AssertTeamLinks(
            0,
            new ReportTestingExtensions.TeamLink(_jon),
            new ReportTestingExtensions.TeamLink(_dave));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "1", "1",
        }));
    }

    [Test]
    public async Task GetReport_GivenMoreOneEightyPlayersThanLimit_ReturnsAtMostRowCount()
    {
        var report = new MostOneEightiesReport(topCount: 2);
        report.VisitOneEighty(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        });
        report.VisitOneEighty(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        });
        report.VisitOneEighty(VisitorScope, new GamePlayer
        {
            Id = _daveId,
        });
        report.VisitOneEighty(VisitorScope, new GamePlayer
        {
            Id = _daveId,
        });
        report.VisitOneEighty(VisitorScope, new GamePlayer
        {
            Id = Guid.NewGuid(),
        });

        var result = await report.GetReport(_playerLookup.Object, _token);

        result.AssertPlayerLinks(
            1,
            new ReportTestingExtensions.PlayerLink(_jon, _jonId),
            new ReportTestingExtensions.PlayerLink(_dave, _daveId));
        result.AssertTeamLinks(
            0,
            new ReportTestingExtensions.TeamLink(_jon),
            new ReportTestingExtensions.TeamLink(_dave));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "2", "2",
        }));
    }
}