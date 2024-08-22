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
    private static readonly DivisionTeamDto Team1 = Team("TEAM 1");
    private static readonly DivisionTeamDto Team2 = Team("TEAM 2");
    private static readonly DivisionTeamDto Team3 = Team("TEAM 3");
    private static readonly DivisionTeamDto Team4 = Team("TEAM 4");
    private static readonly DivisionPlayerDto Player1 = Player("PLAYER_1", "TEAM 1");
    private static readonly DivisionPlayerDto Player2 = Player("PLAYER_2", Player1.Team, Player1.TeamId);
    private static readonly DivisionPlayerDto Player3 = Player("PLAYER_3", "TEAM 3", oneEighties: 3, over100Checkouts: 102);
    private static readonly DivisionPlayerDto Player4 = Player("PLAYER_4", Player3.Team, Player3.TeamId, oneEighties: 3, over100Checkouts: 102);

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
    private DivisionFixtureDateDto _tournamentFixtureDateDto;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _manOfTheMatchReport = new Mock<IReport>();
        _division1 = new DivisionDto { Id = Guid.NewGuid(), Name = "Division 1", };
        _division2 = new DivisionDto { Id = Guid.NewGuid(), Name = "Division 2", };
        _divisions = new[] { _division1, _division2, };
        _divisionData1 = new DivisionDataDto { Id = _division1.Id, Name = _division1.Name, };
        _divisionData2 = new DivisionDataDto { Id = _division2.Id, Name = _division2.Name, };
        _season = new SeasonDto { Id = Guid.NewGuid(), Divisions = { _division1, _division2 } };
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
        _momReport = new ReportDto { Rows = { Row(Cell("TEAM"), Cell("MOM"), Cell("5")) } };
        _tournament = new TournamentGameDto
        {
            Id = Guid.NewGuid(),
            DivisionId = _division1.Id,
            Date = new DateTime(2001, 02, 03),
            Address = "ADDRESS",
            Type = "Knockout",
            Round = Round(Match("SIDE A", "SIDE B", 1, 2)),
        };
        _tournamentFixtureDateDto = DivisionFixtureDateDto(new DateTime(2001, 02, 03), DivisionTournamentFixtureDetailsDto(_tournament.Id, type: _tournament.Type));
        _report = new FinalsNightReport(_userService.Object, _manOfTheMatchReport.Object, _season, _divisionService.Object, _tournamentService.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _divisionService
            .Setup(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.DivisionId.Contains(_division1.Id)), _token))
            .ReturnsAsync(_divisionData1);
        _divisionService
            .Setup(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.DivisionId.Contains(_division2.Id)), _token))
            .ReturnsAsync(_divisionData2);
        _divisionService.Setup(s => s.GetAll(_token)).Returns(() => TestUtilities.AsyncEnumerable(_divisions));
        _manOfTheMatchReport.Setup(r => r.GetReport(_playerLookup, _token)).ReturnsAsync(() => _momReport);
        _tournamentService.Setup(s => s.Get(_tournament.Id, _token)).ReturnsAsync(_tournament);
    }

    [Test]
    public async Task GetReport_WhenNoDivisions_ReturnsNoDivisions()
    {
        _divisions = Array.Empty<DivisionDto>();

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Could not produce report", "⚠️ No divisions found");
    }

    [Test]
    public async Task GetReport_WhenTournamentCannotBeAccessed_ReturnsWarning()
    {
        var inaccessibleTournamentId = Guid.NewGuid();
        _divisionData1.Fixtures.Add(DivisionFixtureDateDto(
            new DateTime(2001, 02, 03),
            DivisionTournamentFixtureDetailsDto(inaccessibleTournamentId)));

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Knockout", "⚠️ Unable to access tournament");
        AssertTournamentLink(report, "Knockout", 1, inaccessibleTournamentId);
    }

    [Test]
    public async Task GetReport_WhenTournamentHasNoType_ReturnsAddressAndDate()
    {
        SetTournamentDetails(clearMatches: true, divisionId: _tournament.DivisionId);

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Division 1: Tournament at ADDRESS on 03 Feb", "⚠️ Has not been played or has no winner");
        AssertTournamentLink(report, "Division 1: Tournament at ADDRESS on 03 Feb", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentHasEmptyType_ReturnsAddressAndDate()
    {
        SetTournamentDetails(type: "", clearMatches: true, divisionId: _tournament.DivisionId);

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Division 1: Tournament at ADDRESS on 03 Feb", "⚠️ Has not been played or has no winner");
        AssertTournamentLink(report, "Division 1: Tournament at ADDRESS on 03 Feb", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentIsCrossDivisional_ReturnsAddressAndDate()
    {
        _divisionData2.Fixtures.Add(_tournamentFixtureDateDto);
        SetTournamentDetails(type: "Finals Night", clearMatches: true);

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report.Rows.Select(r => r.Cells[0].Text).Count(t => t == "Finals Night"), Is.EqualTo(1));
        AssertReportRow(report, "Finals Night", "⚠️ Has not been played or has no winner");
        AssertTournamentLink(report, "Finals Night", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentIsSuperLeague_ExcludesTournament()
    {
        SetTournamentDetails(type: "SuperLeague", divisionId: _tournament.DivisionId, singleRound: true);

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report.Rows.Select(r => r.Cells[0].Text), Has.No.Member("SuperLeague"));
    }

    [Test]
    public async Task GetReport_WhenTournamentIsExcludedFromReports_ExcludesTournament()
    {
        SetTournamentDetails(type: "Singles", divisionId: _tournament.DivisionId, excludeFromReports: true);

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report.Rows.Select(r => r.Cells[0].Text), Has.No.Member("Singles"));
    }

    [Test]
    public async Task GetReport_WhenTournamentHasNotBeenPlayed_ReturnsWarning()
    {
        SetTournamentDetails(type: "Knockout", clearMatches: true);

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Knockout", "⚠️ Has not been played or has no winner");
        AssertTournamentLink(report, "Knockout", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentHasNoWinner_ReturnsWarning()
    {
        SetTournamentDetails(type: "Knockout");
        _tournament.Round!.Matches[0].ScoreA = 1;
        _tournament.Round!.Matches[0].ScoreB = 1;

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Knockout", "⚠️ Has not been played or has no winner");
        AssertTournamentLink(report, "Knockout", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentExistsWithNestedWinner_ReturnsKnockout()
    {
        SetTournamentDetails(type: "Knockout");
        _tournament.Round!.NextRound = Round(Match("SIDE C", "SIDE D", 1, 2));

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Knockout winner", "SIDE D");
        AssertReportRow(report, "Knockout runner up", "SIDE C");
        AssertTournamentLink(report, "Knockout winner", 1, _tournament.Id);
        AssertTournamentLink(report, "Knockout runner up", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentExistsWithNoRound_ReturnsKnockout()
    {
        SetTournamentDetails(type: "Knockout");
        _tournament.Round = null;

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Knockout", "⚠️ Has not been played or has no winner");
        AssertTournamentLink(report, "Knockout", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentExistsNoSideNames_ReturnsNoSideName()
    {
        _tournament.Round!.Matches[0].SideA.Name = null;
        _tournament.Round!.Matches[0].SideB.Name = null;
        SetTournamentDetails(type: "KNOCKOUT");

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "KNOCKOUT winner", "⚠️ <no side name>");
        AssertReportRow(report, "KNOCKOUT runner up", "⚠️ <no side name>");
        AssertTournamentLink(report, "KNOCKOUT winner", 1, _tournament.Id);
        AssertTournamentLink(report, "KNOCKOUT runner up", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentExistsEmptySideNames_ReturnsNoSideName()
    {
        _divisionData1.Fixtures.Add(_tournamentFixtureDateDto);
        _tournament.Round!.Matches[0].SideA.Name = "";
        _tournament.Round!.Matches[0].SideB.Name = "";
        SetTournamentDetails(type: "Knockout");

        var report = await _report.GetReport(_playerLookup, _token);

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

        AssertReportRow(report, "Man of the match");
    }

    [Test]
    public async Task GetReport_WhenPermitted_ReturnsManOfTheMatchDetail()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Man of the match", "MOM", "5");
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithSameQuantity_ReturnsListOfPlayerNames()
    {
        _momReport.Rows.Add(Row(
            Cell("TEAM", teamId: Guid.NewGuid()),
            Cell("MOM_1", playerId: Guid.NewGuid()),
            Cell("10")));
        _momReport.Rows.Add(Row(
            Cell("TEAM", teamId: Guid.NewGuid()),
            Cell("MOM_2", playerId: Guid.NewGuid()),
            Cell("10")));

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Man of the match", "MOM_1, MOM_2", "10");
    }

    [Test]
    public async Task GetReport_WhenNoManOfTheMatchRows_ReturnsEmptyManOfTheMatch()
    {
        _momReport.Rows.Clear();

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Man of the match", "");
    }

    [Test]
    public async Task GetReport_WhenSinglePlayerWithMost180s_Returns180sForEachDivisions()
    {
        _divisionData1.Players.Add(Player1);
        _divisionData2.Players.Add(Player3);

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Division 1: Most 180s", "PLAYER_1", "2");
        AssertReportRow(report, "Division 2: Most 180s", "PLAYER_3", "3");
        AssertPlayerLink(report, "Division 1: Most 180s", 1, Player1, _division1);
        AssertPlayerLink(report, "Division 2: Most 180s", 1, Player3, _division2);
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithMost180s_Returns180sForEachDivisions()
    {
        _divisionData1.Players.AddRange(new[] { Player1, Player2 });
        _divisionData2.Players.AddRange(new[] { Player3, Player4 });

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Division 1: Most 180s", "PLAYER_1, PLAYER_2", "2");
        AssertReportRow(report, "Division 2: Most 180s", "PLAYER_3, PLAYER_4", "3");
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithMost180sFromTheSameTeam_Returns180sForEachDivisions()
    {
        _divisionData1.Players.AddRange(new[] { Player1, Player2 });
        _divisionData2.Players.AddRange(new[] { Player3, Player4 });

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Division 1: Most 180s", "PLAYER_1, PLAYER_2", "2");
        AssertReportRow(report, "Division 2: Most 180s", "PLAYER_3, PLAYER_4", "3");
        AssertTeamLink(report, "Division 1: Most 180s", 1, Player1.Team, Player1.TeamId, _division1);
        AssertTeamLink(report, "Division 2: Most 180s", 1, Player3.Team, Player3.TeamId, _division2);
    }

    [Test]
    public async Task GetReport_WhenNoPlayersWith180s_Returns180sForEachDivisions()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Division 1: Most 180s", "");
        AssertReportRow(report, "Division 2: Most 180s", "");
    }

    [Test]
    public async Task GetReport_WhenPlayersOnlyHaveNo180s_Returns180sForEachDivisions()
    {
        _divisionData1.Players.Add(new DivisionPlayerDto());
        _divisionData2.Players.Add(new DivisionPlayerDto());

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Division 1: Most 180s", "");
        AssertReportRow(report, "Division 2: Most 180s", "");
    }

    [Test]
    public async Task GetReport_WhenSinglePlayerWithHiCheck_ReturnsHiChecksForEachDivisions()
    {
        _divisionData1.Players.Add(Player1);
        _divisionData2.Players.Add(Player3);

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Division 1: Highest checkout", "PLAYER_1", "101");
        AssertReportRow(report, "Division 2: Highest checkout", "PLAYER_3", "102");
        AssertPlayerLink(report, "Division 1: Highest checkout", 1, Player1, _division1);
        AssertPlayerLink(report, "Division 2: Highest checkout", 1, Player3, _division2);
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithHighestCheck_ReturnsHiChecksForEachDivisions()
    {
        _divisionData1.Players.AddRange(new[] { Player1, Player2 });
        _divisionData2.Players.AddRange(new[] { Player3, Player4 });

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Division 1: Highest checkout", "PLAYER_1, PLAYER_2", "101");
        AssertReportRow(report, "Division 2: Highest checkout", "PLAYER_3, PLAYER_4", "102");
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithHighestCheckFromTheSameTeam_ReturnsHiChecksForEachDivisions()
    {
        _divisionData1.Players.AddRange(new[] { Player1, Player2 });
        _divisionData2.Players.AddRange(new[] { Player3, Player4 });

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Division 1: Highest checkout", "PLAYER_1, PLAYER_2", "101");
        AssertReportRow(report, "Division 2: Highest checkout", "PLAYER_3, PLAYER_4", "102");
        AssertTeamLink(report, "Division 1: Highest checkout", 1, Player1.Team, Player1.TeamId, _division1);
        AssertTeamLink(report, "Division 2: Highest checkout", 1, Player3.Team, Player3.TeamId, _division2);
    }

    [Test]
    public async Task GetReport_WhenNoPlayersWithHiCheck_ReturnsHiChecksForEachDivisions()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Division 1: Highest checkout", "");
        AssertReportRow(report, "Division 2: Highest checkout", "");
    }

    [Test]
    public async Task GetReport_WhenPlayersOnlyHaveNoHiCheck_ReturnsHiChecksForEachDivisions()
    {
        _divisionData1.Players.Add(new DivisionPlayerDto());
        _divisionData2.Players.Add(new DivisionPlayerDto());

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Division 1: Highest checkout", "");
        AssertReportRow(report, "Division 2: Highest checkout", "");
    }

    [Test]
    public async Task GetReport_WhenMultipleTeamsRanked_ReturnsWinningAndRunnerUpTeams()
    {
        _divisionData1.Teams.AddRange(new[] { Team1, Team2 });
        _divisionData2.Teams.AddRange(new[] { Team3, Team4 });

        var report = await _report.GetReport(_playerLookup, _token);

        AssertReportRow(report, "Division 1: runner up", "TEAM 2");
        AssertReportRow(report, "Division 1: winner", "TEAM 1");
        AssertReportRow(report, "Division 2: runner up", "TEAM 4");
        AssertReportRow(report, "Division 2: winner", "TEAM 3");
        AssertTeamLink(report, "Division 1: runner up", 1, Team2.Name, Team2.Id, _division1);
        AssertTeamLink(report, "Division 1: winner", 1, Team1.Name, Team1.Id, _division1);
        AssertTeamLink(report, "Division 2: runner up", 1, Team4.Name, Team4.Id, _division2);
        AssertTeamLink(report, "Division 2: winner", 1, Team3.Name, Team3.Id, _division2);
    }

    [Test]
    public async Task GetReport_WhenNoTeams_ReturnsEmpty()
    {
        var report = await _report.GetReport(_playerLookup, _token);

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

    private static ReportRowDto Row(params ReportCellDto[] cells)
    {
        return new ReportRowDto
        {
            Cells = cells.ToList(),
        };
    }

    private static ReportCellDto Cell(string text, Guid? teamId = null, Guid? playerId = null)
    {
        return new ReportCellDto
        {
            Text = text,
            TeamId = teamId,
            PlayerId = playerId,
        };
    }
    
    private static DivisionTeamDto Team(string name)
    {
        return new DivisionTeamDto
        {
            Name = name,
            Id = Guid.NewGuid(),
        };
    }

    private static DivisionPlayerDto Player(string name, string team, Guid? teamId = null, int oneEighties = 2, int over100Checkouts = 101)
    {
        return new DivisionPlayerDto
        {
            Name = name,
            Over100Checkouts = over100Checkouts,
            OneEighties = oneEighties,
            Id = Guid.NewGuid(),
            TeamId = teamId ?? Guid.NewGuid(),
            Team = team,
        };
    }

    private static TournamentSideDto Side(string name)
    {
        return new TournamentSideDto
        {
            Name = name,
        };
    }

    private static TournamentMatchDto Match(string sideA, string sideB, int scoreA, int scoreB)
    {
        return new TournamentMatchDto
        {
            SideA = Side(sideA),
            SideB = Side(sideB),
            ScoreA = scoreA,
            ScoreB = scoreB,
        };
    }

    private static TournamentRoundDto Round(params TournamentMatchDto[] matches)
    {
        return new TournamentRoundDto
        {
            Matches = matches.ToList(),
        };
    }

    private static DivisionTournamentFixtureDetailsDto DivisionTournamentFixtureDetailsDto(Guid id, string type = "Knockout")
    {
        return new DivisionTournamentFixtureDetailsDto
        {
            Id = id,
            Type = type,
        };
    }

    private static DivisionFixtureDateDto DivisionFixtureDateDto(DateTime date, params DivisionTournamentFixtureDetailsDto[] fixtures)
    {
        return new DivisionFixtureDateDto
        {
            Date = date,
            TournamentFixtures = fixtures.ToList(),
        };
    }

    private void SetTournamentDetails(string? type = null, Guid? divisionId = null, bool clearMatches = false, bool singleRound = false, bool excludeFromReports = false)
    {
        _divisionData1.Fixtures.Add(_tournamentFixtureDateDto);

        _tournament.Type = type;
        _tournament.DivisionId = divisionId;
        _tournament.SingleRound = singleRound;
        _tournament.ExcludeFromReports = excludeFromReports;

        if (clearMatches)
        {
            _tournament.Round!.Matches.Clear();
        }
    }
}