using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Report;
using CourageScores.Services.Report;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class MostPlayedPlayerReportTests
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
        var report = new MostPlayedPlayerReport(topCount: 3);

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

        Assert.That(result.Rows, Is.Empty);
    }

    [TestCase(true, 2)]
    [TestCase(false, 2)]
    public async Task GetReport_GivenLeagueSinglesOneEightyTwice_ReturnsRowOnce(bool singlesOnly, int score)
    {
        var report = new MostPlayedPlayerReport(topCount: 3, singlesOnly: singlesOnly);
        report.VisitPlayer(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        }, 1);
        report.VisitPlayer(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        }, 1);

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerId), Is.EquivalentTo(new[]
        {
            _jonId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerName), Is.EquivalentTo(new[]
        {
            _jon.PlayerName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamId), Is.EquivalentTo(new[]
        {
            _jon.TeamId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamName), Is.EquivalentTo(new[]
        {
            _jon.TeamName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            score.ToString(),
        }));
    }

    [TestCase(true, 1)]
    [TestCase(false, 2)]
    public async Task GetReport_GivenLeaguePairsOneEighty_ReturnsCorrectScore(bool singlesOnly, int score)
    {
        var report = new MostPlayedPlayerReport(topCount: 3, singlesOnly: singlesOnly);
        report.VisitPlayer(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        }, 1);
        report.VisitPlayer(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        }, 2);

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerId), Is.EquivalentTo(new[]
        {
            _jonId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerName), Is.EquivalentTo(new[]
        {
            _jon.PlayerName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamId), Is.EquivalentTo(new[]
        {
            _jon.TeamId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamName), Is.EquivalentTo(new[]
        {
            _jon.TeamName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            score.ToString(),
        }));
    }

    [TestCase(true, 1)]
    [TestCase(false, 2)]
    public async Task GetReport_GivenLeagueTriplesOneEighty_IgnoresScore(bool singlesOnly, int score)
    {
        var report = new MostPlayedPlayerReport(topCount: 3, singlesOnly: singlesOnly);
        report.VisitPlayer(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        }, 1);
        report.VisitPlayer(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        }, 3);

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerId), Is.EquivalentTo(new[]
        {
            _jonId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerName), Is.EquivalentTo(new[]
        {
            _jon.PlayerName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamId), Is.EquivalentTo(new[]
        {
            _jon.TeamId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamName), Is.EquivalentTo(new[]
        {
            _jon.TeamName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            score.ToString(),
        }));
    }

    [Test]
    public async Task GetReport_GivenTournamentOneEightyAndSinglesOnly_IgnoresScore()
    {
        var report = new MostPlayedPlayerReport(topCount: 3, singlesOnly: true);
        report.VisitTournamentPlayer(VisitorScope, new TournamentPlayer
        {
            Id = _jonId,
        });

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

        Assert.That(result.Rows, Is.Empty);
    }

    [Test]
    public async Task GetReport_GivenTournamentOneEightyAndAllMatches_ReturnsCorrectScore()
    {
        var report = new MostPlayedPlayerReport(topCount: 3, singlesOnly: false);
        report.VisitTournamentPlayer(VisitorScope, new TournamentPlayer
        {
            Id = _jonId,
        });

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerId), Is.EquivalentTo(new[]
        {
            _jonId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerName), Is.EquivalentTo(new[]
        {
            _jon.PlayerName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamId), Is.EquivalentTo(new[]
        {
            _jon.TeamId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamName), Is.EquivalentTo(new[]
        {
            _jon.TeamName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "1",
        }));
    }

    [Test]
    public async Task GetReport_GivenSinglesLeagueDifferentPlayersScoreOneEighty_ReturnsRowOnce()
    {
        var report = new MostPlayedPlayerReport(topCount: 3, singlesOnly: true);
        report.VisitPlayer(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        }, 1);
        report.VisitPlayer(VisitorScope, new GamePlayer
        {
            Id = _daveId,
        }, 1);

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerId), Is.EquivalentTo(new[]
        {
            _jonId, _daveId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerName), Is.EquivalentTo(new[]
        {
            _jon.PlayerName, _dave.PlayerName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamId), Is.EquivalentTo(new[]
        {
            _jon.TeamId, _dave.TeamId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamName), Is.EquivalentTo(new[]
        {
            _jon.TeamName, _dave.TeamName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "1", "1",
        }));
    }

    [Test]
    public async Task GetReport_GivenTournamentPlayerScoresOneEightyTwice_ReturnsRowOnce()
    {
        var report = new MostPlayedPlayerReport(topCount: 3, singlesOnly: false);
        report.VisitTournamentPlayer(VisitorScope, new TournamentPlayer
        {
            Id = _jonId,
        });
        report.VisitTournamentPlayer(VisitorScope, new TournamentPlayer
        {
            Id = _jonId,
        });

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerId), Is.EquivalentTo(new[]
        {
            _jonId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerName), Is.EquivalentTo(new[]
        {
            _jon.PlayerName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamId), Is.EquivalentTo(new[]
        {
            _jon.TeamId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamName), Is.EquivalentTo(new[]
        {
            _jon.TeamName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "2",
        }));
    }

    [Test]
    public async Task GetReport_GivenTournamentDifferentPlayersScoreOneEighty_ReturnsRowOnce()
    {
        var report = new MostPlayedPlayerReport(topCount: 3, singlesOnly: false);
        report.VisitTournamentPlayer(VisitorScope, new TournamentPlayer
        {
            Id = _jonId,
        });
        report.VisitTournamentPlayer(VisitorScope, new TournamentPlayer
        {
            Id = _daveId,
        });

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerId), Is.EquivalentTo(new[]
        {
            _jonId, _daveId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerName), Is.EquivalentTo(new[]
        {
            _jon.PlayerName, _dave.PlayerName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamId), Is.EquivalentTo(new[]
        {
            _jon.TeamId, _dave.TeamId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamName), Is.EquivalentTo(new[]
        {
            _jon.TeamName, _dave.TeamName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "1", "1",
        }));
    }

    [Test]
    public async Task GetReport_GivenMoreOneEightyPlayersThanLimit_ReturnsAtMostRowCount()
    {
        var report = new MostPlayedPlayerReport(topCount: 2);
        report.VisitPlayer(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        }, 1);
        report.VisitPlayer(VisitorScope, new GamePlayer
        {
            Id = _jonId,
        }, 1);
        report.VisitPlayer(VisitorScope, new GamePlayer
        {
            Id = _daveId,
        }, 1);
        report.VisitPlayer(VisitorScope, new GamePlayer
        {
            Id = _daveId,
        }, 1);
        report.VisitPlayer(VisitorScope, new GamePlayer
        {
            Id = Guid.NewGuid(),
        }, 1);

        var result = await report.GetReport(_request, _playerLookup.Object, _token);

        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerId), Is.EquivalentTo(new[]
        {
            _jonId, _daveId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[1].PlayerName), Is.EquivalentTo(new[]
        {
            _jon.PlayerName, _dave.PlayerName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamId), Is.EquivalentTo(new[]
        {
            _jon.TeamId, _dave.TeamId,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[0].TeamName), Is.EquivalentTo(new[]
        {
            _jon.TeamName, _dave.TeamName,
        }));
        Assert.That(result.Rows.Select(r => r.Cells[2].Text), Is.EquivalentTo(new[]
        {
            "2", "2",
        }));
    }
}