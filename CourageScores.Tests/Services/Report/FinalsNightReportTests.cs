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
    private Mock<IDivisionService> _divisionService = null!;
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
        _divisionService = new Mock<IDivisionService>();
        _tournamentService = new Mock<IGenericDataService<TournamentGame, TournamentGameDto>>();
        _momReport = new ReportDto
        {
            Rows =
            {
                new ReportRowDto
                {
                    PlayerName = "MOM",
                    TeamName = "TEAM",
                    Value = 5,
                },
            },
        };
        _tournament = new TournamentGameDto
        {
            Id = Guid.NewGuid(),
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
            .Setup(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.DivisionId == _division1.Id), _token))
            .ReturnsAsync(_divisionData1);
        _divisionService
            .Setup(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.DivisionId == _division2.Id), _token))
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
        Assert.That(report.Rows.Select(r => r.PlayerName), Is.EqualTo(new[] { "Could not produce report" }));
        Assert.That(report.Rows.Select(r => r.TeamName), Is.EqualTo(new[] { "⚠ No divisions found" }));
    }

    [Test]
    public async Task GetReport_WhenKnockoutDateDoesNotExist_ReturnsWarning()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Knockout", "⚠️ No date found with this note");
    }

    [Test]
    public async Task GetReport_WhenSingleKnockoutDateExistsButWithProposedTournamentsOnly_ReturnsWarning()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "Knockout",
                    Proposed = true,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
            },
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Knockout", "⚠️ No date found with this note");
    }

    [Test]
    public async Task GetReport_WhenMultipleKnockoutDatesExist_ReturnsWarning()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "Knockout",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
            },
        });
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 03, 04),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "Knockout",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
            },
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Knockout", "⚠️ Multiple dates (2) found with this note");
    }

    [Test]
    public async Task GetReport_WhenKnockoutTournamentDoesNotExistWithKnockoutType_ReturnsWarning()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "Something else",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
            },
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Knockout - Knockout", "⚠️ No tournament found with this type");
    }

    [Test]
    public async Task GetReport_WhenSubsidTournamentDoesNotExistWithSubsidType_ReturnsWarning()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "Something else",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
            },
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Knockout - Subsid", "⚠️ No tournament found with this type");
    }

    [Test]
    public async Task GetReport_WhenKnockoutTournamentCannotBeAccessed_ReturnsWarning()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = Guid.NewGuid(),
                    Proposed = false,
                    Type = "Knockout",
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
            },
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Knockout - Knockout", "⚠️ Unable to access tournament");
    }

    [Test]
    public async Task GetReport_WhenKnockoutTournamentHasNotBeenPlayed_ReturnsWarning()
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
                    Type = "Knockout",
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
            },
        });
        _tournament.Round!.Matches.Clear();

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout", "⚠️ Has not been played or has no winner");
    }

    [Test]
    public async Task GetReport_WhenKnockoutTournamentHasNoWinner_ReturnsWarning()
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
                    Type = "Knockout",
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
            },
        });
        _tournament.Round!.Matches[0].ScoreA = 1;
        _tournament.Round!.Matches[0].ScoreB = 1;

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout", "⚠️ Has not been played or has no winner");
    }

    [Test]
    public async Task GetReport_WhenKnockoutDateExistsWithExtraTextInNote_ReturnsKnockout()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "Knockout",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout and Subsid cup" },
            },
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout winner", "SIDE B");
        AssertReportRow(report, "Knockout runner up", "SIDE A");
    }

    [Test]
    public async Task GetReport_WhenKnockoutDateExistsWithNestedWinner_ReturnsKnockout()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "Knockout",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
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

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout winner", "SIDE D");
        AssertReportRow(report, "Knockout runner up", "SIDE C");
    }

    [Test]
    public async Task GetReport_WhenKnockoutDateExistsWithNoRound_ReturnsKnockout()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "Knockout",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
            },
        });
        _tournament.Round = null;

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout", "⚠️ Has not been played or has no winner");
    }

    [Test]
    public async Task GetReport_WhenKnockoutTournamentExistsWithDifferentCasedType_ReturnsKnockout()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "KNOCKOUT",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
            },
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout winner", "SIDE B");
        AssertReportRow(report, "Knockout runner up", "SIDE A");
    }

    [Test]
    public async Task GetReport_WhenSubsidTournamentExists_ReturnsSubsid()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "Subsid",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
            },
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Subsid winner", "SIDE B");
        AssertReportRow(report, "Subsid runner up", "SIDE A");
    }

    [Test]
    public async Task GetReport_WhenKnockoutTournamentExistsNoSideNames_ReturnsNoSideName()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "KNOCKOUT",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
            },
        });
        _tournament.Round!.Matches[0].SideA.Name = null;
        _tournament.Round!.Matches[0].SideB.Name = null;

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout winner", "⚠️ <no side name>");
        AssertReportRow(report, "Knockout runner up", "⚠️ <no side name>");
    }

    [Test]
    public async Task GetReport_WhenKnockoutTournamentExistsEmptySideNames_ReturnsNoSideName()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "KNOCKOUT",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Knockout" },
            },
        });
        _tournament.Round!.Matches[0].SideA.Name = "";
        _tournament.Round!.Matches[0].SideB.Name = "";

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Knockout winner", "⚠️ <no side name>");
        AssertReportRow(report, "Knockout runner up", "⚠️ <no side name>");
    }

    [Test]
    public async Task GetReport_WhenNotPermitted_ReturnsEmptyManOfTheMatch()
    {
        _user!.Access!.ManageScores = false;

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Man of the match", "");
    }

    [Test]
    public async Task GetReport_WhenPermitted_ReturnsManOfTheMatchDetail()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Man of the match", "MOM", 5);
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithSameQuantity_ReturnsListOfPlayerNames()
    {
        _momReport.Rows.Add(new ReportRowDto
        {
            PlayerName = "MOM_1",
            Value = 10,
        });
        _momReport.Rows.Add(new ReportRowDto
        {
            PlayerName = "MOM_2",
            Value = 10,
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Man of the match", "MOM_1, MOM_2", 10);
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
        _divisionData1.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER",
            OneEighties = 2,
        });
        _divisionData2.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER",
            OneEighties = 3,
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1 most 180s", "PLAYER", 2);
        AssertReportRow(report, "Division 2 most 180s", "PLAYER", 3);
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithMost180s_Returns180sForEachDivisions()
    {
        _divisionData1.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER_1",
            OneEighties = 2,
        });
        _divisionData1.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER_2",
            OneEighties = 2,
        });
        _divisionData2.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER_3",
            OneEighties = 3,
        });
        _divisionData2.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER_4",
            OneEighties = 3,
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1 most 180s", "PLAYER_1, PLAYER_2", 2);
        AssertReportRow(report, "Division 2 most 180s", "PLAYER_3, PLAYER_4", 3);
    }

    [Test]
    public async Task GetReport_WhenNoPlayersWith180s_Returns180sForEachDivisions()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1 most 180s", "");
        AssertReportRow(report, "Division 2 most 180s", "");
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
        AssertReportRow(report, "Division 1 most 180s", "");
        AssertReportRow(report, "Division 2 most 180s", "");
    }

    [Test]
    public async Task GetReport_WhenSinglePlayerWithHiCheck_ReturnsHiChecksForEachDivisions()
    {
        _divisionData1.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER",
            Over100Checkouts = 101,
        });
        _divisionData2.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER",
            Over100Checkouts = 102,
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1 highest checkout", "PLAYER", 101);
        AssertReportRow(report, "Division 2 highest checkout", "PLAYER", 102);
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithHighestCheck_ReturnsHiChecksForEachDivisions()
    {
        _divisionData1.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER_1",
            Over100Checkouts = 101,
        });
        _divisionData1.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER_2",
            Over100Checkouts = 101,
        });
        _divisionData2.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER_3",
            Over100Checkouts = 102,
        });
        _divisionData2.Players.Add(new DivisionPlayerDto
        {
            Name = "PLAYER_4",
            Over100Checkouts = 102,
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1 highest checkout", "PLAYER_1, PLAYER_2", 101);
        AssertReportRow(report, "Division 2 highest checkout", "PLAYER_3, PLAYER_4", 102);
    }

    [Test]
    public async Task GetReport_WhenNoPlayersWithHiCheck_ReturnsHiChecksForEachDivisions()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1 highest checkout", "");
        AssertReportRow(report, "Division 2 highest checkout", "");
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
        AssertReportRow(report, "Division 1 highest checkout", "");
        AssertReportRow(report, "Division 2 highest checkout", "");
    }

    [Test]
    public async Task GetReport_WhenNoDivisionalSinglesDate_ReturnsNoDivisionalSinglesRows()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Divisional Singles", "⚠️ No date found with this note");
    }

    [Test]
    public async Task GetReport_WhenNoTournamentsInDivisionalSinglesDate_ReturnsNoDivisionalSinglesRows()
    {
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "Something else",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Divisional Singles" },
            },
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Divisional Singles - Divisional Singles", "⚠️ No tournament found with this type");
    }

    [Test]
    public async Task GetReport_WhenDivisionalSinglesDateWithOtherTextInNote_ReturnsDivisionalSinglesFromOneDivisionAndEmptyForOther()
    {
        _tournament.DivisionId = _division1.Id;
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "DIVISIONAL SINGLES",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Divisional Singles at some address" },
            },
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Divisional Singles runner up", "SIDE A");
        AssertReportRow(report, "Division 1: Divisional Singles winner", "SIDE B");
    }

    [Test]
    public async Task GetReport_WhenDivisionalSinglesInBothDivisions_ReturnsDivisionalSinglesFromBothDivisions()
    {
        _tournament.DivisionId = _division1.Id;
        _divisionData1.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "DIVISIONAL SINGLES",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Divisional Singles at some address" },
            },
        });
        _divisionData2.Fixtures.Add(new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures =
            {
                new DivisionTournamentFixtureDetailsDto
                {
                    Id = _tournament.Id,
                    Type = "DIVISIONAL SINGLES",
                    Proposed = false,
                },
            },
            Notes =
            {
                new FixtureDateNoteDto { Note = "Divisional Singles at some address" },
            },
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1: Divisional Singles runner up", "SIDE A");
        AssertReportRow(report, "Division 1: Divisional Singles winner", "SIDE B");
        AssertReportRow(report, "Division 2: Divisional Singles runner up", "SIDE A");
        AssertReportRow(report, "Division 2: Divisional Singles winner", "SIDE B");
    }

    [Test]
    public async Task GetReport_WhenMultipleTeamsRanked_ReturnsWinningAndRunnerUpTeams()
    {
        _divisionData1.Teams.Add(new DivisionTeamDto
        {
            Name = "TEAM 1",
        });
        _divisionData1.Teams.Add(new DivisionTeamDto
        {
            Name = "TEAM 2",
        });
        _divisionData2.Teams.Add(new DivisionTeamDto
        {
            Name = "TEAM 3",
        });
        _divisionData2.Teams.Add(new DivisionTeamDto
        {
            Name = "TEAM 4",
        });

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1 runner up", "TEAM 2");
        AssertReportRow(report, "Division 1 winner", "TEAM 1");
        AssertReportRow(report, "Division 2 runner up", "TEAM 4");
        AssertReportRow(report, "Division 2 winner", "TEAM 3");
    }

    [Test]
    public async Task GetReport_WhenNoTeams_ReturnsEmpty()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report, Is.Not.Null);
        AssertReportRow(report, "Division 1 runner up", "⚠️ Not found");
        AssertReportRow(report, "Division 1 winner", "⚠️ Not found");
        AssertReportRow(report, "Division 2 runner up", "⚠️ Not found");
        AssertReportRow(report, "Division 2 winner", "⚠️ Not found");
    }

    private static void AssertReportRow(ReportDto report, string playerName, string teamName, double? value = null)
    {
        Assert.That(report.Rows.Select(r => r.PlayerName).ToArray(), Has.Member(playerName));
        var reportRow = report.Rows.Single(r => r.PlayerName == playerName);
        Assert.That(reportRow.TeamName, Is.EqualTo(teamName));
        Assert.That(reportRow.Value, Is.EqualTo(value));
    }
}