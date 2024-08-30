using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Report;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Report;

public static class FinalsNightReportTestsHelpers
{
    public static ReportRowDto Row(params ReportCellDto[] cells)
    {
        return new ReportRowDto
        {
            Cells = cells.ToList(),
        };
    }

    public static ReportCellDto Cell(string text, Guid? teamId = null, Guid? playerId = null)
    {
        return new ReportCellDto
        {
            Text = text,
            TeamId = teamId,
            PlayerId = playerId,
        };
    }

    public static DivisionTeamDto Team(string name)
    {
        return new DivisionTeamDto
        {
            Name = name,
            Id = Guid.NewGuid(),
        };
    }

    public static DivisionPlayerDto Player(string name, string team, Guid? teamId = null, int oneEighties = 2, int over100Checkouts = 101)
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

    public static TournamentMatchDto Match(string sideA, string sideB, int scoreA, int scoreB)
    {
        return new TournamentMatchDto
        {
            SideA = Side(sideA),
            SideB = Side(sideB),
            ScoreA = scoreA,
            ScoreB = scoreB,
        };
    }

    public static TournamentRoundDto Round(params TournamentMatchDto[] matches)
    {
        return new TournamentRoundDto
        {
            Matches = matches.ToList(),
        };
    }

    public static DivisionTournamentFixtureDetailsDto DivisionTournamentFixtureDetailsDto(Guid id, string type = "Knockout")
    {
        return new DivisionTournamentFixtureDetailsDto
        {
            Id = id,
            Type = type,
        };
    }

    public static DivisionFixtureDateDto DivisionFixtureDateDto(DateTime date, params DivisionTournamentFixtureDetailsDto[] fixtures)
    {
        return new DivisionFixtureDateDto
        {
            Date = date,
            TournamentFixtures = fixtures.ToList(),
        };
    }

    public static void AssertReportRow(ReportDto report, string firstColumn, string? secondColumn = null, string? value = null)
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

    public static void AssertTeamLink(ReportDto report, string firstColumn, int columnIndex, string teamName, Guid teamId, DivisionDto division)
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

    public static void AssertPlayerLink(ReportDto report, string firstColumn, int columnIndex, DivisionPlayerDto player, DivisionDto division)
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

    public static void AssertTournamentLink(ReportDto report, string firstColumn, int columnIndex, Guid tournamentId)
    {
        Assert.That(report.Rows.Select(r => r.Cells[0].Text).ToArray(), Has.Member(firstColumn));
        var reportRow = report.Rows.Single(r => r.Cells[0].Text == firstColumn);
        Assert.That(reportRow.Cells.Count, Is.GreaterThan(columnIndex));
        var reportCell = reportRow.Cells[columnIndex];
        Assert.That(reportCell.TournamentId, Is.EqualTo(tournamentId));
    }

    private static TournamentSideDto Side(string name)
    {
        return new TournamentSideDto
        {
            Name = name,
        };
    }
}