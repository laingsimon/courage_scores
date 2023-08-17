using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
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
            new[]
            {
                fixtureInDivision, otherDivisionFixture,
            },
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());

        var result = context.AllGames(divisionId).ToArray();

        Assert.That(result, Is.EquivalentTo(new[]
        {
            fixtureInDivision,
        }));
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
            new[]
            {
                knockoutInDivision, otherDivisionKnockout,
            },
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());

        var result = context.AllGames(divisionId).ToArray();

        Assert.That(result, Is.EquivalentTo(new[]
        {
            knockoutInDivision, otherDivisionKnockout,
        }));
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
            new[]
            {
                fixtureInDivision,
                otherDivisionFixture,
                knockoutInDivision,
                otherDivisionKnockout,
            },
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());

        var result = context.AllGames(divisionId).ToArray();

        Assert.That(result, Is.EquivalentTo(new[]
        {
            fixtureInDivision,
            otherDivisionFixture,
            knockoutInDivision,
            otherDivisionKnockout,
        }));
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
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            new[]
            {
                tournamentInDivision, crossDivisionTournament,
            },
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());

        var result = context.AllTournamentGames(null);

        Assert.That(result, Is.EquivalentTo(new[]
        {
            tournamentInDivision, crossDivisionTournament,
        }));
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
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            new[]
            {
                tournamentInDivision,
                tournamentInAnotherDivision,
                crossDivisionTournament,
            },
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto());

        var result = context.AllTournamentGames(tournamentInDivision.DivisionId);

        Assert.That(result, Is.EquivalentTo(new[]
        {
            tournamentInDivision, crossDivisionTournament,
        }));
    }
}