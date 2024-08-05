using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Game;
using CourageScores.Services.Season;
using CourageScores.Services.Team;
using Moq;
using Newtonsoft.Json;
using NUnit.Framework;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateTeamCommandTests
{
    private static readonly Guid DivisionId = Guid.NewGuid();
    private static readonly Guid SeasonId = Guid.NewGuid();
    private static readonly TeamDto AnotherTeam = new TeamDto
    {
        Name = "Another team",
        Id = Guid.NewGuid(),
        Address = "Another address",
    };
    private static readonly GameTeamDto AnotherTeamDto = new GameTeamDto
    {
        Id = AnotherTeam.Id,
        Name = AnotherTeam.Name,
    };
    private static readonly TeamDto LambA = new TeamDto
    {
        Name = "Lamb A",
        Id = Guid.NewGuid(),
        Address = "The Lamb",
    };
    private static readonly GameTeamDto LambADto = new GameTeamDto
    {
        Id = LambA.Id,
        Name = LambA.Name,
    };
    private static readonly TeamDto LambB = new TeamDto
    {
        Name = "Lamb B",
        Id = Guid.NewGuid(),
        Address = "The Lamb",
    };
    private static readonly GameTeamDto LambBDto = new GameTeamDto
    {
        Id = LambB.Id,
        Name = LambB.Name,
    };

    private readonly CancellationToken _token = new();
    private readonly IJsonSerializerService _serializer = new JsonSerializerService(new JsonSerializer());

    private Mock<IGameService> _gameService = null!;
    private Mock<ICachingTeamService> _teamService = null!;
    private Mock<ICommandFactory> _commandFactory = null!;
    private AddOrUpdateTeamCommand _command = null!;
    private Mock<AddOrUpdateGameCommand> _addOrUpdateGameCommand = null!;
    private Mock<AddSeasonToTeamCommand> _addSeasonToTeamCommand = null!;
    private Mock<ICachingSeasonService> _seasonService = null!;
    private List<GameDto> _games = null!;
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private ActionResult<TeamSeason> _addSeasonToTeamActionResult = null!;
    private TeamSeason _addedTeamSeason = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _games = new List<GameDto>();
        _cacheFlags = new ScopedCacheManagementFlags();
        _addedTeamSeason = new TeamSeason
        {
            SeasonId = SeasonId,
        };
        _addSeasonToTeamActionResult = new ActionResult<TeamSeason>
        {
            Success = true,
            Messages =
            {
                "Success",
            },
            Result = _addedTeamSeason,
        };

        _gameService = new Mock<IGameService>();
        _teamService = new Mock<ICachingTeamService>();
        _commandFactory = new Mock<ICommandFactory>();
        _seasonService = new Mock<ICachingSeasonService>();
        _command = new AddOrUpdateTeamCommand(_teamService.Object, _gameService.Object, _commandFactory.Object, _cacheFlags, _serializer);
        _addOrUpdateGameCommand = new Mock<AddOrUpdateGameCommand>(_seasonService.Object, _commandFactory.Object, _teamService.Object, _cacheFlags);
        _addSeasonToTeamCommand = new Mock<AddSeasonToTeamCommand>(new Mock<IAuditingHelper>().Object, _seasonService.Object, _cacheFlags);

        _addOrUpdateGameCommand
            .Setup(c => c.WithData(It.IsAny<EditGameDto>()))
            .Returns(_addOrUpdateGameCommand.Object);
        _addSeasonToTeamCommand
            .Setup(c => c.ForSeason(SeasonId))
            .Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand
            .Setup(c => c.ForDivision(DivisionId))
            .Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand
            .Setup(c => c.ApplyUpdate(It.IsAny<CosmosTeam>(), _token))
            .ReturnsAsync((CosmosTeam team, CancellationToken _) =>
            {
                team.Seasons.Add(_addedTeamSeason);
                return _addSeasonToTeamActionResult;
            });
        _commandFactory
            .Setup(f => f.GetCommand<AddOrUpdateGameCommand>())
            .Returns(_addOrUpdateGameCommand.Object);
        _commandFactory
            .Setup(f => f.GetCommand<AddSeasonToTeamCommand>())
            .Returns(_addSeasonToTeamCommand.Object);
        _gameService
            .Setup(s => s.GetWhere($"t.DivisionId = '{DivisionId}' and t.SeasonId = '{SeasonId}'", _token))
            .Returns(() => TestUtilities.AsyncEnumerable(_games.ToArray()));
    }

    [Test]
    public async Task ApplyUpdates_WhenNoGamesInDivisionAndSeason_UpdatesTeamProperties()
    {
        var team = GetTeam();
        var update = Update(team);

        var result = await _command.WithData(update).ApplyUpdate(team, _token);

        Assert.That(team.Name, Is.EqualTo(update.Name));
        Assert.That(team.Address, Is.EqualTo(update.Address));
        var teamSeason = team.Seasons.SingleOrDefault(ts => ts.SeasonId == update.SeasonId);
        Assert.That(teamSeason, Is.Not.Null);
        Assert.That(teamSeason!.DivisionId, Is.EqualTo(update.DivisionId));
        Assert.That(result.Success, Is.True);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(SeasonId));
    }

    [Test]
    public async Task ApplyUpdates_WhenTeamIsNotAssignedToSeason_AddsSeasonToTeam()
    {
        var team = GetTeam(withSeason: false);
        var update = Update(team);

        var result = await _command.WithData(update).ApplyUpdate(team, _token);

        var teamSeason = team.Seasons.SingleOrDefault(ts => ts.SeasonId == update.SeasonId);
        Assert.That(teamSeason, Is.Not.Null);
        Assert.That(teamSeason!.DivisionId, Is.EqualTo(update.DivisionId));
        Assert.That(result.Success, Is.True);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(SeasonId));
    }

    [Test]
    public async Task ApplyUpdates_WhenTeamIsNotAssignedToSeasonAndAssignmentFails_ReturnsFailure()
    {
        var team = GetTeam(withSeason: false);
        _addSeasonToTeamActionResult = new ActionResult<TeamSeason>
        {
            Success = false,
            Messages =
            {
                "Some error",
            },
        };

        var result = await _command.WithData(Update(team)).ApplyUpdate(team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Some error",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdates_WhenHomeGameInDivisionAndSeason_UpdatesTeamProperties()
    {
        var team = GetTeam();
        var game = new GameDto
        {
            Home = GameTeamDto(team),
            Away = AnotherTeamDto,
            Id = Guid.NewGuid(),
        };
        var update = Update(team);
        _games.Add(game);

        var result = await _command.WithData(update).ApplyUpdate(team, _token);

        _addOrUpdateGameCommand.Verify(c => c.WithData(It.Is<EditGameDto>(dto => EditGameDtoMatches(dto, game, update))));
        _gameService.Verify(s => s.Upsert(game.Id, _addOrUpdateGameCommand.Object, _token));
        Assert.That(result.Success, Is.True);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(SeasonId));
    }

    [Test]
    public async Task ApplyUpdates_WhenHomeGameInDivisionAndSeasonAndDivisionChanged_DoesNotUpdateDivision()
    {
        var team = GetTeam();
        _games.Add(new GameDto
        {
            Home = GameTeamDto(team),
            Away = AnotherTeamDto,
            Id = Guid.NewGuid(),
        });
        var update = Update(team);
        update.Address = "new address";
        update.Name = "name name";
        update.NewDivisionId = Guid.NewGuid();

        var result = await _command.WithData(update).ApplyUpdate(team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdates_WhenAwayGameInDivisionAndSeason_UpdatesTeamProperties()
    {
        var team = GetTeam();
        var game = new GameDto
        {
            Home = AnotherTeamDto,
            Away = GameTeamDto(team),
            Id = Guid.NewGuid(),
        };
        _games.Add(game);

        var result = await _command.WithData(Update(team)).ApplyUpdate(team, _token);

        _addOrUpdateGameCommand.Verify(c => c.WithData(It.IsAny<EditGameDto>()), Times.Never);
        _gameService.Verify(s => s.Upsert(game.Id, _addOrUpdateGameCommand.Object, _token), Times.Never);
        Assert.That(result.Success, Is.True);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(SeasonId));
    }

    [TestCase("the lamb")]
    [TestCase("THE LAMB")]
    public async Task ApplyUpdates_WhenHomeAddressIsUpdatedToSameAsAnotherFixtureHomeAddressOnSameDate_ReturnsFalse(string updateAddress)
    {
        var team = GetTeam();
        _games.Add(new GameDto
        {
            Home = LambADto,
            Away = AnotherTeamDto,
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
        });
        _games.Add(new GameDto
        {
            Home = LambBDto,
            Away = AnotherTeamDto,
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
        });
        var update = Update(team);
        update.Address = updateAddress;
        _teamService.Setup(s => s.Get(AnotherTeam.Id, _token)).ReturnsAsync(AnotherTeam);
        _teamService.Setup(s => s.Get(LambB.Id, _token)).ReturnsAsync(LambB);
        _teamService.Setup(s => s.Get(LambA.Id, _token)).ReturnsAsync(LambA);

        var result = await _command.WithData(update).ApplyUpdate(team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            $"Unable to update address, {updateAddress} is in use for multiple games on the same dates, see 03 Feb 2001: Lamb A vs Another team, Lamb B vs Another team",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [TestCase("the lamb")]
    [TestCase("THE LAMB")]
    public async Task ApplyUpdates_WhenAddressIsUpdatedToSameAsAnotherFixtureAddress_ReturnsFalse(string updateAddress)
    {
        var team = GetTeam();
        _games.Add(new GameDto
        {
            Address = "The Lamb",
            Home = LambADto,
            Away = AnotherTeamDto,
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
        });
        _games.Add(new GameDto
        {
            Address = "The Lamb",
            Home = LambBDto,
            Away = AnotherTeamDto,
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
        });
        var update = Update(team);
        update.Address = updateAddress;
        _teamService.Setup(s => s.Get(AnotherTeam.Id, _token)).ReturnsAsync(AnotherTeam);
        _teamService.Setup(s => s.Get(LambA.Id, _token)).ReturnsAsync(LambA);
        _teamService.Setup(s => s.Get(LambB.Id, _token)).ReturnsAsync(LambB);

        var result = await _command.WithData(update).ApplyUpdate(team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            $"Unable to update address, {updateAddress} is in use for multiple games on the same dates, see 03 Feb 2001: Lamb A vs Another team, Lamb B vs Another team",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdates_WhenGameExistsAndDivisionIsChanged_ReturnsFalse()
    {
        var team = GetTeam();
        _games.Add(new GameDto
        {
            Address = "The Lamb",
            Home = GameTeamDto(team),
            Away = AnotherTeamDto,
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
            DivisionId = DivisionId,
        });
        var update = Update(team);
        update.NewDivisionId = Guid.NewGuid();
        _teamService.Setup(s => s.Get(AnotherTeam.Id, _token)).ReturnsAsync(AnotherTeam);

        var result = await _command.WithData(update).ApplyUpdate(team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "Unable to change division when games exist, delete these 1 game/s first",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [TestCase("new address")]
    [TestCase("NEW ADDRESS")]
    public async Task ApplyUpdates_WhenHomeAddressIsUpdatedToSameAsAnotherTeamAddress_ReturnsTrue(string updateAddress)
    {
        var team = GetTeam();
        _games.Add(new GameDto
        {
            Home = AnotherTeamDto,
            Away = GameTeamDto(team),
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
        });
        var update = Update(team);
        update.Address = updateAddress;
        _teamService.Setup(s => s.Get(AnotherTeam.Id, _token)).ReturnsAsync(AnotherTeam);

        var result = await _command.WithData(update).ApplyUpdate(team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Team updated",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(SeasonId));
    }

    [Test]
    public async Task ApplyUpdates_WhenAnExistingTeamHasANullAddress_IgnoresTeamWithNullAddress()
    {
        var team = GetTeam();
        var awayTeam = new TeamDto
        {
            Id = AnotherTeam.Id,
#pragma warning disable CS8625
            Address = null,
#pragma warning restore CS8625
        };
        var game = new GameDto
        {
            Home = GameTeamDto(team),
            Away = AnotherTeamDto,
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
        };
        _games.Add(game);
        _teamService.Setup(s => s.Get(awayTeam.Id, _token)).ReturnsAsync(awayTeam);

        var result = await _command.WithData(Update(team)).ApplyUpdate(team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Team updated",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(SeasonId));
    }

    [Test]
    public async Task? ApplyUpdates_WhenAGameRefersToMissingTeam_IgnoresMissingTeam()
    {
        var team = GetTeam();
        var game = new GameDto
        {
            Home = GameTeamDto(team),
            Away = AnotherTeamDto,
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
        };
        _games.Add(game);
        _teamService.Setup(s => s.Get(AnotherTeam.Id, _token)).ReturnsAsync(() => null);

        var result = await _command.WithData(Update(team)).ApplyUpdate(team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Team updated",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(SeasonId));
    }

    private static bool EditGameDtoMatches(EditGameDto editGameDto, GameDto game, EditTeamDto update)
    {
        // equal to updated value
        Assert.That(editGameDto.DivisionId, Is.EqualTo(update.DivisionId), "DivisionId");
        Assert.That(editGameDto.Address, Is.EqualTo(update.Address), "Address");

        // equal to current value
        Assert.That(editGameDto.Id, Is.EqualTo(game.Id), "GameId");
        Assert.That(editGameDto.Date, Is.EqualTo(game.Date), "Date");
        Assert.That(editGameDto.IsKnockout, Is.EqualTo(game.IsKnockout), "IsKnockout");
        Assert.That(editGameDto.Postponed, Is.EqualTo(game.Postponed), "Postponed");
        Assert.That(editGameDto.HomeTeamId, Is.EqualTo(game.Home.Id), "HomeTeamId");
        Assert.That(editGameDto.AwayTeamId, Is.EqualTo(game.Away.Id), "AwayTeamId");
        return true;
    }

    private static CosmosTeam GetTeam(bool withSeason = true)
    {
        var team = new CosmosTeam
        {
            Id = Guid.NewGuid(),
            Name = "old name",
            Address = "old address",
        };

        if (withSeason)
        {
            team.Seasons.Add(new TeamSeason
            {
                SeasonId = SeasonId,
                DivisionId = DivisionId,
            });
        }

        return team;
    }

    private static GameTeamDto GameTeamDto(CosmosTeam team)
    {
        return new GameTeamDto
        {
            Id = team.Id,
            Name = team.Name,
        };
    }

    private static EditTeamDto Update(CosmosTeam team)
    {
        return new EditTeamDto
        {
            Name = "new name",
            Address = "new address",
            DivisionId = DivisionId,
            SeasonId = SeasonId,
            Id = team.Id,
            NewDivisionId = DivisionId,
            LastUpdated = team.Updated,
        };
    }
}