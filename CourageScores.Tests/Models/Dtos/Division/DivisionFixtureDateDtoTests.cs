using CourageScores.Common;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Dtos.Division;

[TestFixture]
public class DivisionFixtureDateDtoTests
{
    private static readonly CancellationToken Token = CancellationToken.None;

    [Test]
    public async Task GetEvents_GivenNotes_ReturnsNoteEvents()
    {
        var note = new FixtureDateNoteDto
        {
            Updated = DateTime.UtcNow,
            Note = "note message",
        };
        var dto = new DivisionFixtureDateDto
        {
            Notes = { note }
        };

        var events = await dto.GetEvents(Token).ToList();

        Assert.That(events.Select(e => e.Title), Is.EquivalentTo([
            "🏷️ note message"
        ]));
    }

    [Test]
    public async Task GetEvents_GivenLeagueFixture_ReturnsFixtureEvents()
    {
        var fixture = new DivisionFixtureDto
        {
            HomeTeam = new DivisionFixtureTeamDto
            {
                Name = "home",
            },
            AwayTeam = new DivisionFixtureTeamDto
            {
                Name = "away",
            },
            FromTime = new DateTime(2001, 02, 03),
            ToTime = new DateTime(2001, 02, 04),
            Updated = DateTime.UtcNow,
        };
        var dto = new DivisionFixtureDateDto
        {
            Fixtures = { fixture }
        };

        var events = await dto.GetEvents(Token).ToList();

        Assert.That(events.Select(e => e.Title), Is.EquivalentTo([
            "🎯 home v away"
        ]));
    }

    [Test]
    public async Task GetEvents_GivenLeagueTournaments_ReturnsTournamentEvents()
    {
        var tournament = new DivisionTournamentFixtureDetailsDto
        {
            Updated = DateTime.UtcNow,
            Type = "type",
        };
        var dto = new DivisionFixtureDateDto
        {
            TournamentFixtures = { tournament }
        };

        var events = await dto.GetEvents(Token).ToList();

        Assert.That(events.Select(e => e.Title), Is.EquivalentTo([
            "🎯 type"
        ]));
    }

    [Test]
    public async Task GetEvents_GivenUnplayedSuperLeagueFixtures_ReturnsUnplayedSuperleagueFixture()
    {
        var superleague = new DivisionTournamentFixtureDetailsDto
        {
            Updated = DateTime.UtcNow,
            SingleRound = true,
            Host = "host",
            Opponent = "opponent",
        };
        var dto = new DivisionFixtureDateDto
        {
            TournamentFixtures = { superleague }
        };

        var events = await dto.GetEvents(Token).ToList();

        Assert.That(events.Select(e => e.Title), Is.EquivalentTo([
            "🎯 host - opponent"
        ]));
    }

    [Test]
    public async Task GetEvents_GivenPlayedSuperLeagueFixtures_ReturnsSuperleagueFixtureWithScores()
    {
        var superleagueBoard1 = new DivisionTournamentFixtureDetailsDto
        {
            Updated = DateTime.UtcNow,
            SingleRound = true,
            Host = "host",
            Opponent = "opponent",
            FirstRoundMatches =
            {
                new TournamentMatchDto
                {
                    SideA = new TournamentSideDto { Name = "board1_sideA" },
                    SideB = new TournamentSideDto { Name = "board1_sideB" },
                    ScoreA = 4,
                    ScoreB = 2,
                }
            },
            Type = "board1",
            Address = "address",
        };
        var superleagueBoard2 = new DivisionTournamentFixtureDetailsDto
        {
            Updated = DateTime.UtcNow,
            SingleRound = true,
            Host = "host",
            Opponent = "opponent",
            FirstRoundMatches =
            {
                new TournamentMatchDto
                {
                    SideA = new TournamentSideDto { Name = "board2_sideA" },
                    SideB = new TournamentSideDto { Name = "board2_sideB" },
                    ScoreA = 6,
                    ScoreB = 3,
                }
            },
            Type = "board2",
            Address = "address",
        };
        var dto = new DivisionFixtureDateDto
        {
            Date = new DateTime(2001, 02, 03),
            TournamentFixtures = { superleagueBoard1, superleagueBoard2 }
        };

        var events = await dto.GetEvents(Token).ToList();

        Assert.That(events.Select(e => e.Title), Is.EquivalentTo([
            "🎯 host 10 - 5 opponent"
        ]));
        Assert.That(events.Select(e => e.Description), Is.EquivalentTo([
            "board1_sideA 4 - 2 board1_sideB\nboard2_sideA 6 - 3 board2_sideB"
        ]));
        Assert.That(events.Select(e => e.Url), Is.EquivalentTo([
            new Uri("/live/superleague/?date=2001-02-03", UriKind.Relative),
        ]));
        Assert.That(events.Select(e => e.Location), Is.EquivalentTo([
            "address",
        ]));
    }
}
