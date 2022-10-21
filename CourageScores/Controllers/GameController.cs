using CourageScores.Models.Dtos.Game;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class GameController : Controller
{
    [HttpGet("/api/Game/{id}")]
    public async Task<GameDto> GetGame(Guid id)
    {
        return new GameDto
        {
            Id = id,
            Division = Guid.Empty,
            Address = "The riv",
            Away = new GameTeamDto
            {
                Id = Guid.Empty,
                Name = "The shed",
                ManOfTheMatch = null,
            },
            Home = new GameTeamDto
            {
                Id = Guid.Empty,
                Name = "The riv",
                ManOfTheMatch = Guid.NewGuid(),
            },
            Date = DateTime.Today,
            Matches = new[]
            {
                new GameMatchDto
                {
                    Id = Guid.NewGuid(),
                    NumberOfLegs = 5,
                    StartingScore = 501,
                    AwayPlayers = new[]
                    {
                        new GamePlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Ash"
                        }
                    },
                    HomePlayers = new[]
                    {
                        new GamePlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Donk",
                        }
                    },
                    AwayScore = 2,
                    HomeScore = 3,
                    OneEighties = new[]
                    {
                        new GamePlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Ask"
                        }
                    },
                    Over100Checkouts = new[]
                    {
                        new NotablePlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Donk",
                            Notes = "Checkout from 123"
                        }
                    }
                }
            }
        };
    }
}