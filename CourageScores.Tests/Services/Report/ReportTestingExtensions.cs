using CourageScores.Models.Dtos.Report;
using CourageScores.Services.Report;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Report;

public static class ReportTestingExtensions
{
    public static void AssertPlayerLinks(this ReportDto report, int cellIndex, params PlayerLink[] players)
    {
        var cells = report.Rows.Select(r => r.Cells[cellIndex]).ToArray();

        Assert.That(cells.Select(r => r.PlayerId).ToArray(), Is.EqualTo(players.Select(p => p.PlayerId).ToArray()), "AssertPlayerLinks: PlayerIds don't match");
        Assert.That(cells.Select(r => r.PlayerName).ToArray(), Is.EqualTo(players.Select(p => p.PlayerName).ToArray()), "AssertPlayerLinks: PlayerNames don't match");
        Assert.That(cells.Select(r => r.TeamId).ToArray(), Is.EqualTo(players.Select(p => p.TeamId).ToArray()), "AssertPlayerLinks: TeamIds don't match");
        Assert.That(cells.Select(r => r.TeamName).ToArray(), Is.EqualTo(players.Select(p => p.TeamName).ToArray()), "AssertPlayerLinks: TeamNames don't match");
        Assert.That(cells.Select(r => r.DivisionId).ToArray(), Is.EqualTo(players.Select(p => p.DivisionId).ToArray()), "AssertPlayerLinks: DivisionIds don't match");
        Assert.That(cells.Select(r => r.DivisionName).ToArray(), Is.EqualTo(players.Select(p => p.DivisionName).ToArray()), "AssertPlayerLinks: DivisionNames don't match");
    }

    public static void AssertTeamLinks(this ReportDto report, int cellIndex, params TeamLink[] players)
    {
        var cells = report.Rows.Select(r => r.Cells[cellIndex]).ToArray();

        Assert.That(cells.Select(r => r.TeamId).ToArray(), Is.EqualTo(players.Select(p => p.TeamId).ToArray()), "AssertTeamLinks: TeamIds don't match");
        Assert.That(cells.Select(r => r.TeamName).ToArray(), Is.EqualTo(players.Select(p => p.TeamName).ToArray()), "AssertTeamLinks: TeamNames don't match");
        Assert.That(cells.Select(r => r.DivisionId).ToArray(), Is.EqualTo(players.Select(p => p.DivisionId).ToArray()), "AssertTeamLinks: DivisionIds don't match");
        Assert.That(cells.Select(r => r.DivisionName).ToArray(), Is.EqualTo(players.Select(p => p.DivisionName).ToArray()), "AssertTeamLinks: DivisionNames don't match");
    }

    public class PlayerLink : TeamLink
    {
        public Guid? PlayerId { get; }
        public string? PlayerName { get; }

        public PlayerLink(PlayerDetails player, Guid playerId, string? divisionName = null)
            :base(player, divisionName)
        {
            PlayerId = playerId;
            PlayerName = player.PlayerName;
        }
    }

    public class TeamLink
    {
        public Guid? TeamId { get; }
        public string? TeamName { get; }
        public Guid? DivisionId { get; }
        public string? DivisionName { get; }

        public TeamLink(PlayerDetails player, string? divisionName = null)
        {
            TeamName = player.TeamName;
            TeamId = player.TeamId;
            DivisionId = player.DivisionId;
            DivisionName = divisionName;
        }
    }
}