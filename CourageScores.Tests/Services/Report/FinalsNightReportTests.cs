using CourageScores.Models.Adapters.Division;
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
using Helper = CourageScores.Tests.Services.Report.FinalsNightReportTestsHelpers;

namespace CourageScores.Tests.Services.Report;

[TestFixture]
public class FinalsNightReportTests
{
    private static readonly DivisionTeamDto Team1 = Helper.Team("TEAM 1");
    private static readonly DivisionTeamDto Team2 = Helper.Team("TEAM 2");
    private static readonly DivisionTeamDto Team3 = Helper.Team("TEAM 3");
    private static readonly DivisionTeamDto Team4 = Helper.Team("TEAM 4");
    private static readonly DivisionPlayerDto Player1 = Helper.Player("PLAYER_1", "TEAM 1");
    private static readonly DivisionPlayerDto Player2 = Helper.Player("PLAYER_2", Player1.Team, Player1.TeamId);
    private static readonly DivisionPlayerDto Player3 = Helper.Player("PLAYER_3", "TEAM 3", oneEighties: 3, over100Checkouts: 102);
    private static readonly DivisionPlayerDto Player4 = Helper.Player("PLAYER_4", Player3.Team, Player3.TeamId, oneEighties: 3, over100Checkouts: 102);

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
    private DivisionFixtureDateDto _tournamentFixtureDateDto = null!;
    private Mock<ITournamentTypeResolver> _tournamentTypeResolver = null!;

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
        _tournamentTypeResolver = new Mock<ITournamentTypeResolver>();
        _momReport = new ReportDto { Rows = { Helper.Row(Helper.Cell("TEAM"), Helper.Cell("MOM"), Helper.Cell("5")) } };
        _tournament = new TournamentGameDto
        {
            Id = Guid.NewGuid(),
            DivisionId = _division1.Id,
            Date = new DateTime(2001, 02, 03),
            Address = "ADDRESS",
            Type = "Knockout",
            Round = Helper.Round(Helper.Match("SIDE A", "SIDE B", 1, 2)),
        };
        _tournamentFixtureDateDto = Helper.DivisionFixtureDateDto(new DateTime(2001, 02, 03), Helper.DivisionTournamentFixtureDetailsDto(_tournament.Id, type: _tournament.Type));
        _report = new FinalsNightReport(_userService.Object, _manOfTheMatchReport.Object, _season, _divisionService.Object, _tournamentService.Object, _tournamentTypeResolver.Object);

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
        _tournamentTypeResolver
            .Setup(r => r.GetTournamentType(It.IsAny<DivisionTournamentFixtureDetailsDto>()))
            .Returns((DivisionTournamentFixtureDetailsDto _) => _tournament.Type ?? "Tournament");
    }

    [Test]
    public async Task GetReport_WhenNoDivisions_ReturnsNoDivisions()
    {
        _divisions = Array.Empty<DivisionDto>();

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Could not produce report", "⚠️ No divisions found");
    }

    [Test]
    public async Task GetReport_WhenTournamentCannotBeAccessed_ReturnsWarning()
    {
        var inaccessibleTournamentId = Guid.NewGuid();
        _divisionData1.Fixtures.Add(Helper.DivisionFixtureDateDto(
            new DateTime(2001, 02, 03),
            Helper.DivisionTournamentFixtureDetailsDto(inaccessibleTournamentId)));

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Knockout", "⚠️ Unable to access tournament");
        Helper.AssertTournamentLink(report, "Knockout", 1, inaccessibleTournamentId);
    }

    [Test]
    public async Task GetReport_WhenUnplayedTournamentHasSinglePlayerSides_ReturnsSinglesType()
    {
        SetTournamentDetails(type: "", clearMatches: true, divisionId: null);
        _tournamentTypeResolver.Setup(r => r.GetTournamentType(It.IsAny<DivisionTournamentFixtureDetailsDto>())).Returns("Singles");

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Singles", "⚠️ Has not been played or has no winner");
    }

    [Test]
    public async Task GetReport_WhenTournamentIsCrossDivisional_ReturnsAddressAndDate()
    {
        _divisionData2.Fixtures.Add(_tournamentFixtureDateDto);
        SetTournamentDetails(type: "Finals Night", clearMatches: true);

        var report = await _report.GetReport(_playerLookup, _token);

        Assert.That(report.Rows.Select(r => r.Cells[0].Text).Count(t => t == "Finals Night"), Is.EqualTo(1));
        Helper.AssertReportRow(report, "Finals Night", "⚠️ Has not been played or has no winner");
        Helper.AssertTournamentLink(report, "Finals Night", 1, _tournament.Id);
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

        Helper.AssertReportRow(report, "Knockout", "⚠️ Has not been played or has no winner");
        Helper.AssertTournamentLink(report, "Knockout", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentHasNoWinner_ReturnsWarning()
    {
        SetTournamentDetails(type: "Knockout");
        _tournament.Round!.Matches[0].ScoreA = 1;
        _tournament.Round!.Matches[0].ScoreB = 1;

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Knockout", "⚠️ Has not been played or has no winner");
        Helper.AssertTournamentLink(report, "Knockout", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentExistsWithNestedWinner_ReturnsKnockout()
    {
        SetTournamentDetails(type: "Knockout");
        _tournament.Round!.NextRound = Helper.Round(Helper.Match("SIDE C", "SIDE D", 1, 2));

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Knockout winner", "SIDE D");
        Helper.AssertReportRow(report, "Knockout runner up", "SIDE C");
        Helper.AssertTournamentLink(report, "Knockout winner", 1, _tournament.Id);
        Helper.AssertTournamentLink(report, "Knockout runner up", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenPlayedTournamentHasSinglePlayerSides_ReturnsSinglesType()
    {
        SetTournamentDetails(type: "", clearMatches: true, divisionId: null);
        _tournament.Round!.NextRound = Helper.Round(Helper.Match("SIDE C", "SIDE D", 1, 2));
        _tournamentTypeResolver.Setup(r => r.GetTournamentType(It.IsAny<DivisionTournamentFixtureDetailsDto>())).Returns("Singles");

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Singles winner", "SIDE D");
        Helper.AssertReportRow(report, "Singles runner up", "SIDE C");
        Helper.AssertTournamentLink(report, "Singles winner", 1, _tournament.Id);
        Helper.AssertTournamentLink(report, "Singles runner up", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentExistsWithNoBestOf_ReturnsWinner()
    {
        SetTournamentDetails(type: "Knockout", bestOf: null);
        _tournament.Round!.NextRound = Helper.Round(Helper.Match("SIDE C", "SIDE D", 3, 1));

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Knockout winner", "SIDE C");
        Helper.AssertReportRow(report, "Knockout runner up", "SIDE D");
        Helper.AssertTournamentLink(report, "Knockout winner", 1, _tournament.Id);
        Helper.AssertTournamentLink(report, "Knockout runner up", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentExistsWithNoRound_ReturnsKnockout()
    {
        SetTournamentDetails(type: "Knockout");
        _tournament.Round = null;

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Knockout", "⚠️ Has not been played or has no winner");
        Helper.AssertTournamentLink(report, "Knockout", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentExistsNoSideNames_ReturnsNoSideName()
    {
        _tournament.Round!.Matches[0].SideA.Name = null;
        _tournament.Round!.Matches[0].SideB.Name = null;
        SetTournamentDetails(type: "KNOCKOUT");

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "KNOCKOUT winner", "⚠️ <no side name>");
        Helper.AssertReportRow(report, "KNOCKOUT runner up", "⚠️ <no side name>");
        Helper.AssertTournamentLink(report, "KNOCKOUT winner", 1, _tournament.Id);
        Helper.AssertTournamentLink(report, "KNOCKOUT runner up", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenTournamentExistsEmptySideNames_ReturnsNoSideName()
    {
        _tournament.Round!.Matches[0].SideA.Name = "";
        _tournament.Round!.Matches[0].SideB.Name = "";
        SetTournamentDetails(type: "Knockout");

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Knockout winner", "⚠️ <no side name>");
        Helper.AssertReportRow(report, "Knockout runner up", "⚠️ <no side name>");
        Helper.AssertTournamentLink(report, "Knockout winner", 1, _tournament.Id);
        Helper.AssertTournamentLink(report, "Knockout runner up", 1, _tournament.Id);
    }

    [Test]
    public async Task GetReport_WhenNotPermitted_ReturnsEmptyManOfTheMatch()
    {
        _user!.Access!.ManageScores = false;

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Man of the match");
    }

    [Test]
    public async Task GetReport_WhenPermitted_ReturnsManOfTheMatchDetail()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Man of the match", "MOM", "5");
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithSameQuantity_ReturnsListOfPlayerNames()
    {
        _momReport.Rows.Add(Helper.Row(
            Helper.Cell("TEAM", teamId: Guid.NewGuid()),
            Helper.Cell("MOM_1", playerId: Guid.NewGuid()),
            Helper.Cell("10")));
        _momReport.Rows.Add(Helper.Row(
            Helper.Cell("TEAM", teamId: Guid.NewGuid()),
            Helper.Cell("MOM_2", playerId: Guid.NewGuid()),
            Helper.Cell("10")));

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Man of the match", "MOM_1, MOM_2", "10");
    }

    [Test]
    public async Task GetReport_WhenNoManOfTheMatchRows_ReturnsEmptyManOfTheMatch()
    {
        _momReport.Rows.Clear();

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Man of the match", "");
    }

    [Test]
    public async Task GetReport_WhenSinglePlayerWithMost180s_Returns180sForEachDivisions()
    {
        _divisionData1.Players.Add(Player1);
        _divisionData2.Players.Add(Player3);

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Division 1: Most 180s", "PLAYER_1", "2");
        Helper.AssertReportRow(report, "Division 2: Most 180s", "PLAYER_3", "3");
        Helper.AssertPlayerLink(report, "Division 1: Most 180s", 1, Player1, _division1);
        Helper.AssertPlayerLink(report, "Division 2: Most 180s", 1, Player3, _division2);
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithMost180s_Returns180sForEachDivisions()
    {
        _divisionData1.Players.AddRange(new[] { Player1, Player2 });
        _divisionData2.Players.AddRange(new[] { Player3, Player4 });

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Division 1: Most 180s", "PLAYER_1, PLAYER_2", "2");
        Helper.AssertReportRow(report, "Division 2: Most 180s", "PLAYER_3, PLAYER_4", "3");
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithMost180sFromTheSameTeam_Returns180sForEachDivisions()
    {
        _divisionData1.Players.AddRange(new[] { Player1, Player2 });
        _divisionData2.Players.AddRange(new[] { Player3, Player4 });

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Division 1: Most 180s", "PLAYER_1, PLAYER_2", "2");
        Helper.AssertReportRow(report, "Division 2: Most 180s", "PLAYER_3, PLAYER_4", "3");
        Helper.AssertTeamLink(report, "Division 1: Most 180s", 1, Player1.Team, Player1.TeamId, _division1);
        Helper.AssertTeamLink(report, "Division 2: Most 180s", 1, Player3.Team, Player3.TeamId, _division2);
    }

    [Test]
    public async Task GetReport_WhenNoPlayersWith180s_Returns180sForEachDivisions()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Division 1: Most 180s", "");
        Helper.AssertReportRow(report, "Division 2: Most 180s", "");
    }

    [Test]
    public async Task GetReport_WhenPlayersOnlyHaveNo180s_Returns180sForEachDivisions()
    {
        _divisionData1.Players.Add(new DivisionPlayerDto());
        _divisionData2.Players.Add(new DivisionPlayerDto());

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Division 1: Most 180s", "");
        Helper.AssertReportRow(report, "Division 2: Most 180s", "");
    }

    [Test]
    public async Task GetReport_WhenSinglePlayerWithHiCheck_ReturnsHiChecksForEachDivisions()
    {
        _divisionData1.Players.Add(Player1);
        _divisionData2.Players.Add(Player3);

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Division 1: Highest checkout", "PLAYER_1", "101");
        Helper.AssertReportRow(report, "Division 2: Highest checkout", "PLAYER_3", "102");
        Helper.AssertPlayerLink(report, "Division 1: Highest checkout", 1, Player1, _division1);
        Helper.AssertPlayerLink(report, "Division 2: Highest checkout", 1, Player3, _division2);
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithHighestCheck_ReturnsHiChecksForEachDivisions()
    {
        _divisionData1.Players.AddRange(new[] { Player1, Player2 });
        _divisionData2.Players.AddRange(new[] { Player3, Player4 });

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Division 1: Highest checkout", "PLAYER_1, PLAYER_2", "101");
        Helper.AssertReportRow(report, "Division 2: Highest checkout", "PLAYER_3, PLAYER_4", "102");
    }

    [Test]
    public async Task GetReport_WhenMultiplePlayersWithHighestCheckFromTheSameTeam_ReturnsHiChecksForEachDivisions()
    {
        _divisionData1.Players.AddRange(new[] { Player1, Player2 });
        _divisionData2.Players.AddRange(new[] { Player3, Player4 });

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Division 1: Highest checkout", "PLAYER_1, PLAYER_2", "101");
        Helper.AssertReportRow(report, "Division 2: Highest checkout", "PLAYER_3, PLAYER_4", "102");
        Helper.AssertTeamLink(report, "Division 1: Highest checkout", 1, Player1.Team, Player1.TeamId, _division1);
        Helper.AssertTeamLink(report, "Division 2: Highest checkout", 1, Player3.Team, Player3.TeamId, _division2);
    }

    [Test]
    public async Task GetReport_WhenNoPlayersWithHiCheck_ReturnsHiChecksForEachDivisions()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Division 1: Highest checkout", "");
        Helper.AssertReportRow(report, "Division 2: Highest checkout", "");
    }

    [Test]
    public async Task GetReport_WhenPlayersOnlyHaveNoHiCheck_ReturnsHiChecksForEachDivisions()
    {
        _divisionData1.Players.Add(new DivisionPlayerDto());
        _divisionData2.Players.Add(new DivisionPlayerDto());

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Division 1: Highest checkout", "");
        Helper.AssertReportRow(report, "Division 2: Highest checkout", "");
    }

    [Test]
    public async Task GetReport_WhenMultipleTeamsRanked_ReturnsWinningAndRunnerUpTeams()
    {
        _divisionData1.Teams.AddRange(new[] { Team1, Team2 });
        _divisionData2.Teams.AddRange(new[] { Team3, Team4 });

        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Division 1: runner up", "TEAM 2");
        Helper.AssertReportRow(report, "Division 1: winner", "TEAM 1");
        Helper.AssertReportRow(report, "Division 2: runner up", "TEAM 4");
        Helper.AssertReportRow(report, "Division 2: winner", "TEAM 3");
        Helper.AssertTeamLink(report, "Division 1: runner up", 1, Team2.Name, Team2.Id, _division1);
        Helper.AssertTeamLink(report, "Division 1: winner", 1, Team1.Name, Team1.Id, _division1);
        Helper.AssertTeamLink(report, "Division 2: runner up", 1, Team4.Name, Team4.Id, _division2);
        Helper.AssertTeamLink(report, "Division 2: winner", 1, Team3.Name, Team3.Id, _division2);
    }

    [Test]
    public async Task GetReport_WhenNoTeams_ReturnsEmpty()
    {
        var report = await _report.GetReport(_playerLookup, _token);

        Helper.AssertReportRow(report, "Division 1: runner up", "⚠️ Not found");
        Helper.AssertReportRow(report, "Division 1: winner", "⚠️ Not found");
        Helper.AssertReportRow(report, "Division 2: runner up", "⚠️ Not found");
        Helper.AssertReportRow(report, "Division 2: winner", "⚠️ Not found");
    }

    private void SetTournamentDetails(string? type = null, Guid? divisionId = null, bool clearMatches = false, bool singleRound = false, bool excludeFromReports = false, int? bestOf = 3)
    {
        _divisionData1.Fixtures.Add(_tournamentFixtureDateDto);

        _tournament.Type = type;
        _tournament.DivisionId = divisionId;
        _tournament.SingleRound = singleRound;
        _tournament.ExcludeFromReports = excludeFromReports;
        _tournament.BestOf = bestOf;

        if (clearMatches)
        {
            _tournament.Round!.Matches.Clear();
        }
    }
}