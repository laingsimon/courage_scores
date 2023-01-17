using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Dtos.Game;

[TestFixture]
public class EditGameDtoTests
{
    [Test]
    public void From_GivenGame_CreatesEditGameDtoCorrectly()
    {
        var game = new GameDto
        {
            Id = Guid.NewGuid(),
            Address = "address",
            Date = new DateTime(2001, 02, 03),
            DivisionId = Guid.NewGuid(),
            Home = new GameTeamDto
            {
                Id = Guid.NewGuid(),
            },
            Away = new GameTeamDto
            {
                Id = Guid.NewGuid(),
            },
            Postponed = true,
            IsKnockout = true,
            ResultsPublished = true,
            SeasonId = Guid.NewGuid(),
        };

        var result = EditGameDto.From(game);

        Assert.That(result.Id, Is.EqualTo(game.Id));
        Assert.That(result.Address, Is.EqualTo(game.Address));
        Assert.That(result.Date, Is.EqualTo(game.Date));
        Assert.That(result.DivisionId, Is.EqualTo(game.DivisionId));
        Assert.That(result.HomeTeamId, Is.EqualTo(game.Home.Id));
        Assert.That(result.AwayTeamId, Is.EqualTo(game.Away.Id));
        Assert.That(result.Postponed, Is.EqualTo(game.Postponed));
        Assert.That(result.IsKnockout, Is.EqualTo(game.IsKnockout));
    }
}