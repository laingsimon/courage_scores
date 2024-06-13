using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Report;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using CourageScores.Services.Report;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class FinalsNightReportTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<IUserService> _userService = null!;
    private Mock<IReport> _manOfTheMatchReport = null!;
    private SeasonDto _season = null!;
    private Mock<ICachingDivisionService> _divisionService = null!;
    private Mock<IGenericDataService<TournamentGame, TournamentGameDto>> _tournamentService = null!;
    private DivisionDto _division1 = null!;
    private DivisionDto _division2 = null!;
    private FinalsNightReport _report = null!;
    private DivisionDataDto _divisionData1 = null!;
    private DivisionDataDto _divisionData2 = null!;
    private UserDto? _user;
    private DivisionDto[] _divisions = null!;
    private PlayerLookup _playerLookup = null!;
    private ReportDto _momReport = null!;
    private TournamentGameDto _tournament = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _manOfTheMatchReport = new Mock<IReport>();
        _division1 = new DivisionDto { Id = Guid.NewGuid(), Name = "Division 1", };
        _division2 = new DivisionDto { Id = Guid.NewGuid(), Name = "Division 2", };
        _divisions = new[]
        {
            _division1,
            _division2,
        };
        _divisionData1 = new DivisionDataDto { Id = _division1.Id, Name = _division1.Name, };
        _divisionData2 = new DivisionDataDto { Id = _division2.Id, Name = _division2.Name, };
        _season = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Divisions =
            {
                _division1,
                _division2,
            },
        };
        _user = new UserDto
        {
            Access = new AccessDto
            {
                RunReports = true,
                ManageScores = true,
            },
        };
        _playerLookup = new PlayerLookup();
        _divisionService = new Mock<ICachingDivisionService>();
        _tournamentService = new Mock<IGenericDataService<TournamentGame, TournamentGameDto>>();
        _momReport = new ReportDto
        {
            Rows =
            {
                new ReportRowDto
                {
                    Cells =
                    {
                        new ReportCellDto { Text = "TEAM" },
                        new ReportCellDto { Text = "MOM" },
                        new ReportCellDto { Text = "5" },
                    },
                },
            },
        };
        _tournament = new TournamentGameDto
        {
            Id = Guid.NewGuid(),
            DivisionId = _division1.Id,
            Round = new TournamentRoundDto
            {
                Matches =
                {
                    new TournamentMatchDto
                    {
                        SideA = new TournamentSideDto { Name = "SIDE A" },
                        SideB = new TournamentSideDto { Name = "SIDE B" },
                        ScoreA = 1,
                        ScoreB = 2,
                    },
                },
            },
        };
        _report = new FinalsNightReport(
            _userService.Object,
            _manOfTheMatchReport.Object,
            _season,
            _divisionService.Object,
            _tournamentService.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _divisionService
            .Setup(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.DivisionId.Contains(_division1.Id)), _token))
            .ReturnsAsync(_divisionData1);
        _divisionService
            .Setup(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.DivisionId.Contains(_division2.Id)), _token))
            .ReturnsAsync(_divisionData2);
        _divisionService.Setup(s => s.GetAll(_token)).Returns(() => TestUtilities.AsyncEnumerable(_divisions));
        _manOfTheMatchReport
            .Setup(r => r.GetReport(_playerLookup, _token))
            .ReturnsAsync(() => _momReport);
        _tournamentService.Setup(s => s.Get(_tournament.Id, _token)).ReturnsAsync(_tournament);
    }

    [Test]
    public async Task GetReport_WhenNoDivisions_ReturnsNoDivisions()
    {
        _divisions = Array.Empty<DivisionDto>();

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        Assert.That(report.Rows.Select(r => r.Cells[0].Text), Is.EqualTo(new[] { "Could not produce report" }));
        Assert.That(report.Rows.Select(r => r.Cells[1].Text), Is.EqualTo(new[] { "⚠️ No divisions found" }));
    }

    [Test]
    public async Task GetReport_WhenTournamentCannotBeAccessed_ReturnsWarning()
    {
        var inaccessibleTournamentId = Guid.NewGuid();
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = inaccessibleTournamentId,
                    Proposed = false,
                    Type = "Knockout",
                },
            },
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout", "⚠️ Unable to access tournament");
        AssertTournamentLink(report, "Knockout", 1, inaccessibleTournamentId);
    }

    [Test]
    public async Task GetReport_WhenTournamentHasNoType_ReturnsAddressAndDate()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Proposed = false,
                },
            },
        });
        _tournament.Date = new DateTime(2001, 02, 03);
        _tournament.Type = null;
        _tournament.Address = "ADDRESS";
        _tournament.Round!.Matches.Clear();

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Tournament at ADDRESS on 03 Feb", "⚠️ Has not been played or has no winner");
        AssertTournamentLink(report, "Division 1: Tournament at ADDRESS on 03 Feb", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentHasEmptyType_ReturnsAddressAndDate()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Proposed = false,
                },
            },
        });
        _tournament.Date = new DateTime(2001, 02, 03);
        _tournament.Type = "";
        _tournament.Address = "ADDRESS";
        _tournament.Round!.Matches.Clear();

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Tournament at ADDRESS on 03 Feb", "⚠️ Has not been played or has no winner");
        AssertTournamentLink(report, "Division 1: Tournament at ADDRESS on 03 Feb", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentIsCrossDivisional_ReturnsAddressAndDate()
    {
        var tournamentData = new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Proposed = false,
                },
            },
        };
        _divisionData1.Fixtures.Add(tournamentData);
        _divisionData2.Fixtures.Add(tournamentData);
        _tournament.Type = "Finals Night";
        _tournament.DivisionId = null;
        _tournament.Round!.Matches.Clear();

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        Assert.That(report.Rows.Select(r => r.Cells[0].Text).Count(t => t == "Finals Night"), Is.EqualTo(1));
        AssertReportRow(report, "Finals Night", "⚠️ Has not been played or has no winner");
        AssertTournamentLink(report, "Finals Night", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentIsSuperLeague_ExcludesTournament()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Proposed = false,
                },
            },
        });
        _tournament.Type = "SuperLeague";
        _tournament.SingleRound = true;

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        Assert.That(report.Rows.Select(r => r.Cells[0].Text), Has.No.Member("SuperLeague"));
    }

    [Test]
    public async Task GetReport_WhenTournamentIsExcludedFromReports_ExcludesTournament()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Proposed = false,
                },
            },
        });
        _tournament.Type = "Singles";
        _tournament.ExcludeFromReports = true;

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        Assert.That(report.Rows.Select(r => r.Cells[0].Text), Has.No.Member("Singles"));
    }

    [Test]
    public async Task GetReport_WhenTournamentHasNotBeenPlayed_ReturnsWarning()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Proposed = false,
                },
            },
        });
        _tournament.Type = "Knockout";
        _tournament.DivisionId = null;
        _tournament.Round!.Matches.Clear();

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout", "⚠️ Has not been played or has no winner");
        AssertTournamentLink(report, "Knockout", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentHasNoWinner_ReturnsWarning()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Proposed = false,
                },
            },
        });
        _tournament.Type = "Knockout";
        _tournament.DivisionId = null;
        _tournament.Round!.Matches[0].ScoreA = 1;
        _tournament.Round!.Matches[0].ScoreB = 1;

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout", "⚠️ Has not been played or has no winner");
        AssertTournamentLink(report, "Knockout", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentExistsWithNestedWinner_ReturnsKnockout()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Proposed = false,
                },
            },
        });
        _tournament.Round!.NextRound = new TournamentRoundDto
        {
            Matches =
            {
                new TournamentMatchDto
                {
                    ScoreA = 1,
                    ScoreB = 2,
                    SideA = new TournamentSideDto
                    {
                        Name = "SIDE C",
                    },
                    SideB = new TournamentSideDto
                    {
                        Name = "SIDE D",
                    },
                },
            },
        };
        _tournament.DivisionId = null;
        _tournament.Type = "Knockout";

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout winner", "SIDE D");
        AssertReportRow(report, "Knockout runner up", "SIDE C");
        AssertTournamentLink(report, "Knockout winner", 1, _tournament.Id);
        AssertTournamentLink(report, "Knockout runner up", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentExistsWithNoRound_ReturnsKnockout()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Proposed = false,
                },
            },
        });
        _tournament.Round = null;
        _tournament.DivisionId = null;
        _tournament.Type = "Knockout";

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout", "⚠️ Has not been played or has no winner");
        AssertTournamentLink(report, "Knockout", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentExistsNoSideNames_ReturnsNoSideName()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Proposed = false,
                },
            },
        });
        _tournament.Round!.Matches[0].SideA.Name = null;
        _tournament.Round!.Matches[0].SideB.Name = null;
        _tournament.DivisionId = null;
        _tournament.Type = "KNOCKOUT";

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "KNOCKOUT winner", "⚠️ <no side name>");
        AssertReportRow(report, "KNOCKOUT runner up", "⚠️ <no side name>");
        AssertTournamentLink(report, "KNOCKOUT winner", 1, _tournament.Id);
        AssertTournamentLink(report, "KNOCKOUT runner up", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentExistsEmptySideNames_ReturnsNoSideName()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Proposed = false,
                },
            },
        });
        _tournament.Round!.Matches[0].SideA.Name = "";
        _tournament.Round!.Matches[0].SideB.Name = "";
        _tournament.DivisionId = null;
        _tournament.Type = "Knockout";

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout winner", "⚠️ <no side name>");
        AssertReportRow(report, "Knockout runner up", "⚠️ <no side name>");
        AssertTournamentLink(report, "Knockout winner", 1, _tournament.Id);
        AssertTournamentLink(report, "Knockout runner up", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenNotPermitted_ReturnsEmptyManOfTheMatch()
    {
        _user!.Access!.ManageScores = false;

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Man of the match");
    }

    [Test]
    public async Task GetReport_WhenPermitted_ReturnsManOfTheMatchDetail()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Man of the match", "MOM", "5");
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithSameQuantity_ReturnsListOfPlayerNames()
    {
        _momReport.Rows.Add(new ReportRowDto
        {
            Cells =
            {
                new ReportCellDto { Text = "TEAM", TeamId = Guid.NewGuid() },
                new ReportCellDto { Text = "MOM_1", PlayerId = Guid.NewGuid(), },
                new ReportCellDto { Text = "10" },
            },
        });
        _momReport.Rows.Add(new ReportRowDto
        {
            Cells =
            {
                new ReportCellDto { Text = "TEAM", TeamId = Guid.NewGuid() },
                new ReportCellDto { Text = "MOM_2", PlayerId = Guid.NewGuid(), },
                new ReportCellDto { Text = "10" },
            },
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Man of the match", "MOM_1, MOM_2", "10");
    }

    [Test]
    public async Task GetReport_WhenNoManOfTheMatchRows_ReturnsEmptyManOfTheMatch()
    {
        _momReport.Rows.Clear();

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Man of the match", "");
    }

    [Test]
    public async Task GetReport_WhenSinglePlayerWithMost180s_Returns180sForEachDivisions()
    {
        var division1Player = new DivisionPlayerDto
        {
            Name = "PLAYER",
            OneEighties = 2,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
        };
        var division2Player = new DivisionPlayerDto
        {
            Name = "PLAYER",
            OneEighties = 3,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
        };
        _divisionData1.Players.Add(division1Player);
        _divisionData2.Players.Add(division2Player);

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Most 180s", "PLAYER", "2");
        AssertReportRow(report, "Division 2: Most 180s", "PLAYER", "3");
        AssertPlayerLink(report, "Division 1: Most 180s", 1, division1Player, _division1);
        AssertPlayerLink(report, "Division 2: Most 180s", 1, division2Player, _division2);
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithMost180s_Returns180sForEachDivisions()
    {
        var player1 = new DivisionPlayerDto
        {
            Name = "PLAYER_1",
            OneEighties = 2,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
            Team = "TEAM 1",
        };
        var player2 = new DivisionPlayerDto
        {
            Name = "PLAYER_2",
            OneEighties = 2,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
            Team = "TEAM 2",
        };
        var player3 = new DivisionPlayerDto
        {
            Name = "PLAYER_3",
            OneEighties = 3,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
            Team = "TEAM 3",
        };
        var player4 = new DivisionPlayerDto
        {
            Name = "PLAYER_4",
            OneEighties = 3,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
            Team = "TEAM 4",
        };
        _divisionData1.Players.Add(player1);
        _divisionData1.Players.Add(player2);
        _divisionData2.Players.Add(player3);
        _divisionData2.Players.Add(player4);

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Most 180s", "PLAYER_1, PLAYER_2", "2");
        AssertReportRow(report, "Division 2: Most 180s", "PLAYER_3, PLAYER_4", "3");
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithMost180sFromTheSameTeam_Returns180sForEachDivisions()
    {
        var player1 = new DivisionPlayerDto
        {
            Name = "PLAYER_1",
            OneEighties = 2,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
            Team = "TEAM 1",
        };
        var player2 = new DivisionPlayerDto
        {
            Name = "PLAYER_2",
            OneEighties = 2,
            Id = Guid.NewGuid(),
            TeamId = player1.TeamId,
            Team = player1.Team,
        };
        var player3 = new DivisionPlayerDto
        {
            Name = "PLAYER_3",
            OneEighties = 3,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
            Team = "TEAM 3",
        };
        var player4 = new DivisionPlayerDto
        {
            Name = "PLAYER_4",
            OneEighties = 3,
            Id = Guid.NewGuid(),
            TeamId = player3.TeamId,
            Team = player3.Team,
        };
        _divisionData1.Players.Add(player1);
        _divisionData1.Players.Add(player2);
        _divisionData2.Players.Add(player3);
        _divisionData2.Players.Add(player4);

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Most 180s", "PLAYER_1, PLAYER_2", "2");
        AssertReportRow(report, "Division 2: Most 180s", "PLAYER_3, PLAYER_4", "3");
        AssertTeamLink(report, "Division 1: Most 180s", 1, player1.Team, player1.TeamId, _division1);
        AssertTeamLink(report, "Division 2: Most 180s", 1, player3.Team, player3.TeamId, _division2);
    }

    [Test]
    public async Task GetReport_WhenNoPlayersWith180s_Returns180sForEachDivisions()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Most 180s", "");
        AssertReportRow(report, "Division 2: Most 180s", "");
    }

    [Test]
    public async Task GetReport_WhenPlayersOnlyHaveNo180s_Returns180sForEachDivisions()
    {
        _divisionData1.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER",
            OneEighties = 0,
        });
        _divisionData2.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER",
            OneEighties = 0,
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Most 180s", "");
        AssertReportRow(report, "Division 2: Most 180s", "");
    }

    [Test]
    public async Task GetReport_WhenSinglePlayerWithHiCheck_ReturnsHiChecksForEachDivisions()
    {
        var division1Player = new DivisionPlayerDto
        {
            Name = "PLAYER",
            Over100Checkouts = 101,
        };
        var division2Player = new DivisionPlayerDto
        {
            Name = "PLAYER",
            Over100Checkouts = 102,
        };
        _divisionData1.Players.Add(division1Player);
        _divisionData2.Players.Add(division2Player);

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Highest checkout", "PLAYER", "101");
        AssertReportRow(report, "Division 2: Highest checkout", "PLAYER", "102");
        AssertPlayerLink(report, "Division 1: Highest checkout", 1, division1Player, _division1);
        AssertPlayerLink(report, "Division 2: Highest checkout", 1, division2Player, _division2);
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithHighestCheck_ReturnsHiChecksForEachDivisions()
    {
        var player1 = new DivisionPlayerDto
        {
            Name = "PLAYER_1",
            Over100Checkouts = 101,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
            Team = "TEAM 1",
        };
        var player2 = new DivisionPlayerDto
        {
            Name = "PLAYER_2",
            Over100Checkouts = 101,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
            Team = "TEAM 2",
        };
        var player3 = new DivisionPlayerDto
        {
            Name = "PLAYER_3",
            Over100Checkouts = 102,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
            Team = "TEAM 3",
        };
        var player4 = new DivisionPlayerDto
        {
            Name = "PLAYER_4",
            Over100Checkouts = 102,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
            Team = "TEAM 4",
        };
        _divisionData1.Players.Add(player1);
        _divisionData1.Players.Add(player2);
        _divisionData2.Players.Add(player3);
        _divisionData2.Players.Add(player4);

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Highest checkout", "PLAYER_1, PLAYER_2", "101");
        AssertReportRow(report, "Division 2: Highest checkout", "PLAYER_3, PLAYER_4", "102");
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithHighestCheckFromTheSameTeam_ReturnsHiChecksForEachDivisions()
    {
        var player1 = new DivisionPlayerDto
        {
            Name = "PLAYER_1",
            Over100Checkouts = 101,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
            Team = "TEAM 1",
        };
        var player2 = new DivisionPlayerDto
        {
            Name = "PLAYER_2",
            Over100Checkouts = 101,
            Id = Guid.NewGuid(),
            TeamId = player1.TeamId,
            Team = player1.Team,
        };
        var player3 = new DivisionPlayerDto
        {
            Name = "PLAYER_3",
            Over100Checkouts = 102,
            Id = Guid.NewGuid(),
            TeamId = Guid.NewGuid(),
            Team = "TEAM 3",
        };
        var player4 = new DivisionPlayerDto
        {
            Name = "PLAYER_4",
            Over100Checkouts = 102,
            Id = Guid.NewGuid(),
            TeamId = player3.TeamId,
            Team = player3.Team,
        };
        _divisionData1.Players.Add(player1);
        _divisionData1.Players.Add(player2);
        _divisionData2.Players.Add(player3);
        _divisionData2.Players.Add(player4);

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Highest checkout", "PLAYER_1, PLAYER_2", "101");
        AssertReportRow(report, "Division 2: Highest checkout", "PLAYER_3, PLAYER_4", "102");
        AssertTeamLink(report, "Division 1: Highest checkout", 1, player1.Team, player1.TeamId, _division1);
        AssertTeamLink(report, "Division 2: Highest checkout", 1, player3.Team, player3.TeamId, _division2);
    }

    [Test]
    public async Task GetReport_WhenNoPlayersWithHiCheck_ReturnsHiChecksForEachDivisions()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Highest checkout", "");
        AssertReportRow(report, "Division 2: Highest checkout", "");
    }

    [Test]
    public async Task GetReport_WhenPlayersOnlyHaveNoHiCheck_ReturnsHiChecksForEachDivisions()
    {
        _divisionData1.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER",
            Over100Checkouts = 0,
        });
        _divisionData2.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER",
            Over100Checkouts = 0,
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Highest checkout", "");
        AssertReportRow(report, "Division 2: Highest checkout", "");
    }

    [Test]
    public async Task GetReport_WhenMultipleTeamsRanked_ReturnsWinningAndRunnerUpTeams()
    {
        var team1 = new DivisionTeamDto
        {
            Name = "TEAM 1",
            Id = Guid.NewGuid(),
        };
        var team2 = new DivisionTeamDto
        {
            Name = "TEAM 2",
            Id = Guid.NewGuid(),
        };
        var team3 = new DivisionTeamDto
        {
            Name = "TEAM 3",
            Id = Guid.NewGuid(),
        };
        var team4 = new DivisionTeamDto
        {
            Name = "TEAM 4",
            Id = Guid.NewGuid(),
        };
        _divisionData1.Teams.Add(team1);
        _divisionData1.Teams.Add(team2);
        _divisionData2.Teams.Add(team3);
        _divisionData2.Teams.Add(team4);

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: runner up", "TEAM 2");
        AssertReportRow(report, "Division 1: winner", "TEAM 1");
        AssertReportRow(report, "Division 2: runner up", "TEAM 4");
        AssertReportRow(report, "Division 2: winner", "TEAM 3");
        AssertTeamLink(report, "Division 1: runner up", 1, team2.Name, team2.Id, _division1);
        AssertTeamLink(report, "Division 1: winner", 1, team1.Name, team1.Id, _division1);
        AssertTeamLink(report, "Division 2: runner up", 1, team4.Name, team4.Id, _division2);
        AssertTeamLink(report, "Division 2: winner", 1, team3.Name, team3.Id, _division2);
    }

    [Test]
    public async Task GetReport_WhenNoTeams_ReturnsEmpty()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: runner up", "⚠️ Not found");
        AssertReportRow(report, "Division 1: winner", "⚠️ Not found");
        AssertReportRow(report, "Division 2: runner up", "⚠️ Not found");
        AssertReportRow(report, "Division 2: winner", "⚠️ Not found");
    }

    private static void AssertReportRow(ReportDto report, string firstColumn, string? secondColumn = null, string? value = null)
    {
        Assert.That(report.Rows.Select(r => r.Cells[0].Text).ToArray(), Has.Member(firstColumn));
        var reportRow = report.Rows.Single(r => r.Cells[0].Text == firstColumn);
        if (secondColumn != null)
        {
            Assert.That(reportRow.Cells[1].Text, Is.EqualTo(secondColumn));
        }
        if (value != null)
        {
            Assert.That(reportRow.Cells[2].Text, Is.EqualTo(value));
        }
    }

    private static void AssertTeamLink(ReportDto report, string firstColumn, int columnIndex, string teamName, Guid teamId, DivisionDto division)
    {
        Assert.That(report.Rows.Select(r => r.Cells[0].Text).ToArray(), Has.Member(firstColumn));
        var reportRow = report.Rows.Single(r => r.Cells[0].Text == firstColumn);
        Assert.That(reportRow.Cells.Count, Is.GreaterThan(columnIndex));
        var reportCell = reportRow.Cells[columnIndex];
        Assert.That(reportCell.TeamName, Is.EqualTo(teamName));
        Assert.That(reportCell.TeamId, Is.EqualTo(teamId));
        Assert.That(reportCell.DivisionId, Is.EqualTo(division.Id));
        Assert.That(reportCell.DivisionName, Is.EqualTo(division.Name));
    }

    private static void AssertPlayerLink(ReportDto report, string firstColumn, int columnIndex, DivisionPlayerDto player, DivisionDto division)
    {
        Assert.That(report.Rows.Select(r => r.Cells[0].Text).ToArray(), Has.Member(firstColumn));
        var reportRow = report.Rows.Single(r => r.Cells[0].Text == firstColumn);
        Assert.That(reportRow.Cells.Count, Is.GreaterThan(columnIndex));
        var reportCell = reportRow.Cells[columnIndex];
        Assert.That(reportCell.TeamName, Is.EqualTo(player.Team));
        Assert.That(reportCell.TeamId, Is.EqualTo(player.TeamId));
        Assert.That(reportCell.PlayerName, Is.EqualTo(player.Name));
        Assert.That(reportCell.PlayerId, Is.EqualTo(player.Id));
        Assert.That(reportCell.DivisionId, Is.EqualTo(division.Id));
        Assert.That(reportCell.DivisionName, Is.EqualTo(division.Name));
    }

    private static void AssertTournamentLink(ReportDto report, string firstColumn, int columnIndex, Guid tournamentId)
    {
        Assert.That(report.Rows.Select(r => r.Cells[0].Text).ToArray(), Has.Member(firstColumn));
        var reportRow = report.Rows.Single(r => r.Cells[0].Text == firstColumn);
        Assert.That(reportRow.Cells.Count, Is.GreaterThan(columnIndex));
        var reportCell = reportRow.Cells[columnIndex];
        Assert.That(reportCell.TournamentId, Is.EqualTo(tournamentId));
    }
}