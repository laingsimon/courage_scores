﻿using CourageScores.Models.Cosmos.Game;
using CourageScores.Services.Report;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class HighestCheckoutReportTests
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
        var report = new HighestCheckoutReport(topCount: 3);

        var result = await report.GetReport(_playerLookup.Object, _token);

        Assert.That(result.Rows, Is.Empty);
    }

    [Test]
    public async Task GetReport_GivenNonNumericalNotes_ReturnsNoRows()
    {
        var report = new HighestCheckoutReport(topCount: 3);
        report.VisitHiCheckout(VisitorScope, new NotablePlayer
        {
            Id = _daveId,
            Notes = "",
        });
        report.VisitHiCheckout(VisitorScope, new NotablePlayer
        {
            Id = _daveId,
            Notes = null,
        });
        report.VisitHiCheckout(VisitorScope, new NotablePlayer
        {
            Id = _daveId,
            Notes = "abcd",
        });

        var result = await report.GetReport(_playerLookup.Object, _token);

        Assert.That(result.Rows, Is.Empty);
    }

    [Test]
    public async Task GetReport_GivenSamePlayerWithDifferentHiChecks_ReturnsRowWithGreatestCheckout()
    {
        var report = new HighestCheckoutReport(topCount: 3);
        report.VisitHiCheckout(VisitorScope, new NotablePlayer
        {
            Id = _daveId,
            Notes = "100",
        });
        report.VisitHiCheckout(VisitorScope, new NotablePlayer
        {
            Id = _daveId,
            Notes = "110",
        });

        var result = await report.GetReport(_playerLookup.Object, _token);

        result.AssertPlayerLinks(
            1,
            new ReportTestingExtensions.PlayerLink(_dave, _daveId));
        result.AssertTeamLinks(
            0,
            new ReportTestingExtensions.TeamLink(_dave));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "110",
        }));
    }

    [Test]
    public async Task GetReport_GivenTwoPlayersWithSameHiChecks_ReturnsBothPlayers()
    {
        var report = new HighestCheckoutReport(topCount: 3);
        report.VisitHiCheckout(VisitorScope, new NotablePlayer
        {
            Id = _daveId,
            Notes = "100",
        });
        report.VisitHiCheckout(VisitorScope, new NotablePlayer
        {
            Id = _jonId,
            Notes = "100",
        });

        var result = await report.GetReport(_playerLookup.Object, _token);

        result.AssertPlayerLinks(
            1,
            new ReportTestingExtensions.PlayerLink(_dave, _daveId),
            new ReportTestingExtensions.PlayerLink(_jon, _jonId));
        result.AssertTeamLinks(
            0,
            new ReportTestingExtensions.TeamLink(_dave),
            new ReportTestingExtensions.TeamLink(_jon));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "100", "100",
        }));
    }

    [Test]
    public async Task GetReport_GivenMorePlayerHiChecksThanLimit_ReturnsNoMoreRowsThanLimit()
    {
        var report = new HighestCheckoutReport(topCount: 2);
        report.VisitHiCheckout(VisitorScope, new NotablePlayer
        {
            Id = _daveId,
            Notes = "103",
        });
        report.VisitHiCheckout(VisitorScope, new NotablePlayer
        {
            Id = _jonId,
            Notes = "102",
        });
        report.VisitHiCheckout(VisitorScope, new NotablePlayer
        {
            Id = Guid.NewGuid(),
            Notes = "101",
        });

        var result = await report.GetReport(_playerLookup.Object, _token);

        result.AssertPlayerLinks(
            1,
            new ReportTestingExtensions.PlayerLink(_dave, _daveId),
            new ReportTestingExtensions.PlayerLink(_jon, _jonId));
        result.AssertTeamLinks(
            0,
            new ReportTestingExtensions.TeamLink(_dave),
            new ReportTestingExtensions.TeamLink(_jon));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "103", "102",
        }));
    }
}