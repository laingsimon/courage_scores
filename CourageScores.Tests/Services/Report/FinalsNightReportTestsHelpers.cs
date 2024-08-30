using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Report;

namespace CourageScores.Tests.Services.Report;

public class FinalsNightReportTestsHelpers
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

    public static TournamentSideDto Side(string name)
    {
        return new TournamentSideDto
        {
            Name = name,
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
}