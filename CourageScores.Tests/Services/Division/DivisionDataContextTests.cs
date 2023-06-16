using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionDataContextTests
{
    [Test]
    public void AllTournamentGames_GivenNullDivisionId_ReturnsAllTournaments()
    {
        var tournamentInDivision = new TournamentGame { DivisionId = Guid.NewGuid() };
        var crossDivisionTournament = new TournamentGame { DivisionId = null };
        var context = new DivisionDataContext(
            Array.Empty<CourageScores.Models.Cosmos.Game.Game>(),
            Array.Empty<TeamDto>(),
            new[] { tournamentInDivision, crossDivisionTournament },
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());

        var result = context.AllTournamentGames(null);

        Assert.That(result, Is.EquivalentTo(new[] { tournamentInDivision, crossDivisionTournament }));
    }

    [Test]
    public void AllTournamentGames_GivenDivisionId_ReturnsAllTournamentsInDivisionOrAcrossDivisions()
    {
        var tournamentInDivision = new TournamentGame { DivisionId = Guid.NewGuid() };
        var tournamentInAnotherDivision = new TournamentGame { DivisionId = Guid.NewGuid() };
        var crossDivisionTournament = new TournamentGame { DivisionId = null };
        var context = new DivisionDataContext(
            Array.Empty<CourageScores.Models.Cosmos.Game.Game>(),
            Array.Empty<TeamDto>(),
            new[] { tournamentInDivision, tournamentInAnotherDivision, crossDivisionTournament },
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());

        var result = context.AllTournamentGames(tournamentInDivision.DivisionId);

        Assert.That(result, Is.EquivalentTo(new[] { tournamentInDivision, crossDivisionTournament }));
    }
}