using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Report;
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
    private ReportRequestDto _request = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _request = new ReportRequestDto();
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

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

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

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

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

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerName), Is.EquivalentTo(new[]
        {
            _dave.PlayerName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamName), Is.EquivalentTo(new[]
        {
            _dave.TeamName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "110",
        }));
        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerId), Is.EquivalentTo(new[]
        {
            _daveId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamId), Is.EquivalentTo(new[]
        {
            _dave.TeamId,
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

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerName), Is.EquivalentTo(new[]
        {
            _dave.PlayerName, _jon.PlayerName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamName), Is.EquivalentTo(new[]
        {
            _dave.TeamName, _jon.TeamName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "100", "100",
        }));
        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerId), Is.EquivalentTo(new[]
        {
            _daveId, _jonId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamId), Is.EquivalentTo(new[]
        {
            _dave.TeamId, _jon.TeamId,
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

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerName), Is.EquivalentTo(new[]
        {
            _dave.PlayerName, _jon.PlayerName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamName), Is.EquivalentTo(new[]
        {
            _dave.TeamName, _jon.TeamName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "103", "102",
        }));
        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerId), Is.EquivalentTo(new[]
        {
            _daveId, _jonId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamId), Is.EquivalentTo(new[]
        {
            _dave.TeamId, _jon.TeamId,
        }));
    }
}