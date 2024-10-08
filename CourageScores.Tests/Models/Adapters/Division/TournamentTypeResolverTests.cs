using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class TournamentTypeResolverTests
{
    [TestCase(null, 0, 0, "Tournament")]
    [TestCase(null, 1, 0, "Tournament")]
    [TestCase(null, 1, 1, "Singles")]
    [TestCase(null, 1, 2, "Pairs")]
    [TestCase(null, 1, 3, "Tournament")]
    [TestCase("", 0, 0, "Tournament")]
    [TestCase("", 1, 0, "Tournament")]
    [TestCase("", 1, 1, "Singles")]
    [TestCase("", 1, 2, "Pairs")]
    [TestCase("", 1, 3, "Tournament")]
    [TestCase("TYPE", 0, 0, "TYPE")]
    [TestCase("TYPE", 1, 0, "TYPE")]
    [TestCase("TYPE", 1, 1, "TYPE")]
    [TestCase("TYPE", 1, 2, "TYPE")]
    [TestCase("TYPE", 1, 3, "TYPE")]
    public void GetTournamentType_GivenTournamentGameWithDifferentNumbersOfPlayers_ReturnsCorrectly(string? type, int sideCount, int playerCount, string expectedTypeName)
    {
        var game = new TournamentGame
        {
            Id = Guid.NewGuid(),
            Type = type,
            Sides = Enumerable.Range(1, sideCount).Select(sideNo => new TournamentSide
            {
                Name = sideNo.ToString(),
                Players = Enumerable.Range(1, playerCount).Select(playerNo => new TournamentPlayer
                {
                    Name = playerNo.ToString(),
                }).ToList(),
            }).ToList(),
        };
        var resolver = new TournamentTypeResolver();

        var result = resolver.GetTournamentType(game);

        Assert.That(result, Is.EqualTo(expectedTypeName));
    }

    [TestCase(null, 0, 0, "Tournament")]
    [TestCase(null, 1, 0, "Tournament")]
    [TestCase(null, 1, 1, "Singles")]
    [TestCase(null, 1, 2, "Pairs")]
    [TestCase(null, 1, 3, "Tournament")]
    [TestCase("", 0, 0, "Tournament")]
    [TestCase("", 1, 0, "Tournament")]
    [TestCase("", 1, 1, "Singles")]
    [TestCase("", 1, 2, "Pairs")]
    [TestCase("", 1, 3, "Tournament")]
    [TestCase("TYPE", 0, 0, "TYPE")]
    [TestCase("TYPE", 1, 0, "TYPE")]
    [TestCase("TYPE", 1, 1, "TYPE")]
    [TestCase("TYPE", 1, 2, "TYPE")]
    [TestCase("TYPE", 1, 3, "TYPE")]
    public void GetTournamentType_GivenTournamentDetailsDtoWithDifferentNumbersOfPlayers_ReturnsCorrectly(string? type, int sideCount, int playerCount, string expectedTypeName)
    {
        var game = new DivisionTournamentFixtureDetailsDto
        {
            Id = Guid.NewGuid(),
            Type = type,
            Sides = Enumerable.Range(1, sideCount).Select(sideNo => new TournamentSideDto
            {
                Name = sideNo.ToString(),
                Players = Enumerable.Range(1, playerCount).Select(playerNo => new TournamentPlayerDto
                {
                    Name = playerNo.ToString(),
                }).ToList(),
            }).ToList(),
        };
        var resolver = new TournamentTypeResolver();

        var result = resolver.GetTournamentType(game);

        Assert.That(result, Is.EqualTo(expectedTypeName));
    }
}