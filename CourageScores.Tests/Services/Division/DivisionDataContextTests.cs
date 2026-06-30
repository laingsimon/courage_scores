using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services.Division;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionDataContextTests
{
    [Test]
    public void AllGames_GivenCrossDivisionalLeagueFixtures_ReturnsOnlyGivenDivisionFixtures()
    {
        var divisionId = Guid.NewGuid();
        var fixtureInDivision = new CosmosGame
        {
            DivisionId = divisionId,
            IsKnockout = false,
        };
        var otherDivisionFixture = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
            IsKnockout = false,
        };
        var context = new DivisionDataContext(
            [fixtureInDivision, otherDivisionFixture],
            [],
            [],
            [],
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>(),
            new DivisionDataFilter());

        var result = context.AllGames(divisionId).ToArray();

        Assert.That(result, Is.EquivalentTo([fixtureInDivision]));
    }

    [Test]
    public void AllGames_GivenKnockoutFixtures_ReturnsKnockoutFixtures()
    {
        var divisionId = Guid.NewGuid();
        var knockoutInDivision = new CosmosGame
        {
            DivisionId = divisionId,
            IsKnockout = true,
        };
        var otherDivisionKnockout = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
            IsKnockout = true,
        };
        var context = new DivisionDataContext(
            [knockoutInDivision, otherDivisionKnockout],
            [],
            [],
            [],
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>(),
            new DivisionDataFilter());

        var result = context.AllGames(divisionId).ToArray();

        Assert.That(result, Is.EquivalentTo([knockoutInDivision, otherDivisionKnockout]));
    }

    [Test]
    public void AllGames_GivenNullDivisionId_ReturnsAllFixtures()
    {
        var divisionId = Guid.NewGuid();
        var fixtureInDivision = new CosmosGame
        {
            DivisionId = divisionId,
            IsKnockout = false,
        };
        var otherDivisionFixture = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
            IsKnockout = true,
        };
        var knockoutInDivision = new CosmosGame
        {
            DivisionId = divisionId,
            IsKnockout = true,
        };
        var otherDivisionKnockout = new CosmosGame
        {
            DivisionId = Guid.NewGuid(),
            IsKnockout = true,
        };
        var context = new DivisionDataContext(
            [
                fixtureInDivision,
                otherDivisionFixture,
                knockoutInDivision,
                otherDivisionKnockout
            ],
            [],
            [],
            [],
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>(),
            new DivisionDataFilter());

        var result = context.AllGames(null).ToArray();

        Assert.That(result, Is.EquivalentTo([
            fixtureInDivision,
            otherDivisionFixture,
            knockoutInDivision,
            otherDivisionKnockout
        ]));
    }

    [Test]
    public void AllTournamentGames_GivenNullDivisionId_ReturnsAllTournaments()
    {
        var tournamentInDivision = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var crossDivisionTournament = new TournamentGame
        {
            DivisionId = null,
        };
        var context = new DivisionDataContext(
            [],
            [],
            [tournamentInDivision, crossDivisionTournament],
            [],
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>(),
            new DivisionDataFilter());

        var result = context.AllTournamentGames(Array.Empty<Guid>());

        Assert.That(result, Is.EquivalentTo([tournamentInDivision, crossDivisionTournament]));
    }

    [Test]
    public void AllTournamentGames_GivenDivisionId_ReturnsAllTournamentsInDivisionOrAcrossDivisions()
    {
        var tournamentInDivision = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var tournamentInAnotherDivision = new TournamentGame
        {
            DivisionId = Guid.NewGuid(),
        };
        var crossDivisionTournament = new TournamentGame
        {
            DivisionId = null,
        };
        var context = new DivisionDataContext(
            [],
            [],
            [
                tournamentInDivision,
                tournamentInAnotherDivision,
                crossDivisionTournament
            ],
            [],
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>(),
            new DivisionDataFilter());

        var result = context.AllTournamentGames([tournamentInDivision.DivisionId.Value]);

        Assert.That(result, Is.EquivalentTo([tournamentInDivision, crossDivisionTournament]));
    }
}
