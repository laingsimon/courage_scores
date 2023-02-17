using CourageScores.Filters;
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

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateTeamCommandTests
{
    private Mock<IGameService> _gameService = null!;
    private Mock<ITeamService> _teamService = null!;
    private Mock<ICommandFactory> _commandFactory = null!;
    private AddOrUpdateTeamCommand _command = null!;
    private Mock<AddOrUpdateGameCommand> _addOrUpdateGameCommand = null!;
    private Mock<ISeasonService> _seasonService = null!;
    private readonly CancellationToken _token = new CancellationToken();
    private readonly Guid _divisionId = Guid.NewGuid();
    private readonly Guid _seasonId = Guid.NewGuid();
    private readonly IJsonSerializerService _serializer = new JsonSerializerService(new JsonSerializer());
    private List<GameDto> _games = null!;
    private CourageScores.Models.Cosmos.Team.Team _team = null!;
    private ScopedCacheManagementFlags _cacheFlags = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _team = new CourageScores.Models.Cosmos.Team.Team
        {
            Id = Guid.NewGuid(),
            Name = "old name",
            Address = "old address",
            DivisionId = _divisionId,
        };
        _games = new List<GameDto>();
        _cacheFlags = new ScopedCacheManagementFlags();

        _gameService = new Mock<IGameService>();
        _teamService = new Mock<ITeamService>();
        _commandFactory = new Mock<ICommandFactory>();
        _seasonService = new Mock<ISeasonService>();
        _command = new AddOrUpdateTeamCommand(_teamService.Object, _gameService.Object, _commandFactory.Object, _cacheFlags, _serializer);
        _addOrUpdateGameCommand = new Mock<AddOrUpdateGameCommand>(_seasonService.Object, _commandFactory.Object, _teamService.Object, _cacheFlags);

        _addOrUpdateGameCommand
            .Setup(c => c.WithData(It.IsAny<EditGameDto>()))
            .Returns(_addOrUpdateGameCommand.Object);
        _commandFactory
            .Setup(f => f.GetCommand<AddOrUpdateGameCommand>())
            .Returns(_addOrUpdateGameCommand.Object);
        _gameService
            .Setup(s => s.GetWhere($"t.DivisionId = '{_divisionId}' and t.SeasonId = '{_seasonId}'", _token))
            .Returns(() => TestUtilities.AsyncEnumerable(_games.ToArray()));
    }

    [Test]
    public async Task ApplyUpdates_WhenNoGamesInDivisionAndSeason_UpdatesTeamProperties()
    {
        var update = new EditTeamDto
        {
            Name = "new name",
            Address = "new address",
            DivisionId = _divisionId,
            SeasonId = _seasonId,
            Id = _team.Id,
            NewDivisionId = _divisionId,
        };

        var result = await _command.WithData(update).ApplyUpdate(_team, _token);

        Assert.That(_team.Name, Is.EqualTo(update.Name));
        Assert.That(_team.Address, Is.EqualTo(update.Address));
        Assert.That(_team.DivisionId, Is.EqualTo(update.DivisionId));
        Assert.That(result.Success, Is.True);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_divisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
    }

    [Test]
    public async Task ApplyUpdates_WhenHomeGameInDivisionAndSeason_UpdatesTeamProperties()
    {
        var game = new GameDto
        {
            Home = new GameTeamDto { Id = _team.Id },
            Away = new GameTeamDto { Id = Guid.NewGuid() },
            Id = Guid.NewGuid(),
        };
        _games.Add(game);
        var update = new EditTeamDto
        {
            DivisionId = _divisionId,
            SeasonId = _seasonId,
            Id = _team.Id,
            Address = "new address",
            Name = "new name",
            NewDivisionId = _divisionId,
        };

        var result = await _command.WithData(update).ApplyUpdate(_team, _token);

        _addOrUpdateGameCommand.Verify(c => c.WithData(It.Is<EditGameDto>(dto => EditGameDtoMatches(dto, game, update))));
        _gameService.Verify(s => s.Upsert(game.Id, _addOrUpdateGameCommand.Object, _token));
        Assert.That(result.Success, Is.True);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_divisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
    }

    [Test]
    public async Task ApplyUpdates_WhenHomeGameInDivisionAndSeasonAndDivisionChanged_DoesNotUpdateDivision()
    {
        var game = new GameDto
        {
            Home = new GameTeamDto { Id = _team.Id },
            Away = new GameTeamDto { Id = Guid.NewGuid() },
            Id = Guid.NewGuid(),
        };
        _games.Add(game);
        var update = new EditTeamDto
        {
            DivisionId = _divisionId,
            SeasonId = _seasonId,
            Id = _team.Id,
            Address = "new address",
            Name = "new name",
            NewDivisionId = Guid.NewGuid(),
        };

        var result = await _command.WithData(update).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(Guid.Empty));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(Guid.Empty));
    }

    [Test]
    public async Task ApplyUpdates_WhenAwayGameInDivisionAndSeason_UpdatesTeamProperties()
    {
        var game = new GameDto
        {
            Home = new GameTeamDto { Id = Guid.NewGuid() },
            Away = new GameTeamDto { Id = _team.Id },
            Id = Guid.NewGuid(),
        };
        _games.Add(game);
        var update = new EditTeamDto
        {
            DivisionId = _divisionId,
            SeasonId = _seasonId,
            Id = _team.Id,
            Address = "new address",
            Name = "new name",
            NewDivisionId = _divisionId,
        };

        var result = await _command.WithData(update).ApplyUpdate(_team, _token);

        _addOrUpdateGameCommand.Verify(c => c.WithData(It.IsAny<EditGameDto>()), Times.Never);
        _gameService.Verify(s => s.Upsert(game.Id, _addOrUpdateGameCommand.Object, _token), Times.Never);
        Assert.That(result.Success, Is.True);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_divisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
    }

    [TestCase("the lamb")]
    [TestCase("THE LAMB")]
    public async Task ApplyUpdates_WhenHomeAddressIsUpdatedToSameAsAnotherFixtureHomeAddressOnSameDate_ReturnsFalse(string updateAddress)
    {
        var lambAOpponent = new TeamDto { Name = "Lamb A Opp", Id = Guid.NewGuid() };
        var lambBOpponent = new TeamDto { Name = "Lamb B Opp", Id = Guid.NewGuid() };
        var lambA = new TeamDto { Name = "Lamb A", Id = _team.Id };
        var lambB = new TeamDto { Name = "Lamb B", Id = Guid.NewGuid(), Address = "The Lamb" };
        var lambAHome = new GameDto
        {
            Home = new GameTeamDto { Id = _team.Id, Name = lambA.Name },
            Away = new GameTeamDto { Id = lambAOpponent.Id, Name = "lambA opponent" },
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
        };
        var lambBHome = new GameDto
        {
            Home = new GameTeamDto { Id = lambB.Id, Name = lambB.Name },
            Away = new GameTeamDto { Id = lambBOpponent.Id, Name = "lambB opponent" },
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
        };
        _games.AddRange(new[] { lambAHome, lambBHome });
        var update = new EditTeamDto
        {
            DivisionId = _divisionId,
            SeasonId = _seasonId,
            Id = _team.Id,
            Address = updateAddress,
            Name = "LAMB A",
            NewDivisionId = _divisionId,
        };
        _teamService.Setup(s => s.Get(lambAOpponent.Id, _token)).ReturnsAsync(lambAOpponent);
        _teamService.Setup(s => s.Get(lambBOpponent.Id, _token)).ReturnsAsync(lambBOpponent);
        _teamService.Setup(s => s.Get(lambB.Id, _token)).ReturnsAsync(lambB);
        _teamService.Setup(s => s.Get(lambA.Id, _token)).ReturnsAsync(lambA);

        var result = await _command.WithData(update).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo($"Unable to update address, {updateAddress} is in use for multiple games on the same dates, see 03 Feb 2001: Lamb A vs lambA opponent, Lamb B vs lambB opponent"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [TestCase("new address")]
    [TestCase("NEW ADDRESS")]
    public async Task ApplyUpdates_WhenHomeAddressIsUpdatedToSameAsAnotherTeamAddress_ReturnsTrue(string updateAddress)
    {
        var otherTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "new address",
        };
        var game = new GameDto
        {
            Home = new GameTeamDto { Id = otherTeam.Id, Name = "other team" },
            Away = new GameTeamDto { Id = _team.Id },
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
        };
        _games.Add(game);
        var update = new EditTeamDto
        {
            DivisionId = _divisionId,
            SeasonId = _seasonId,
            Id = _team.Id,
            Address = updateAddress,
            Name = "new name",
            NewDivisionId = _divisionId,
        };
        _teamService.Setup(s => s.Get(otherTeam.Id, _token)).ReturnsAsync(otherTeam);

        var result = await _command.WithData(update).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Team updated"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_divisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
    }

    [Test]
    public async Task ApplyUpdates_WhenAnExistingTeamHasANullAddress_IgnoresTeamWithNullAddress()
    {
        var awayTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
#pragma warning disable CS8625
            Address = null,
#pragma warning restore CS8625
        };
        var game = new GameDto
        {
            Home = new GameTeamDto { Id = _team.Id },
            Away = new GameTeamDto { Id = awayTeam.Id, Name = "away team" },
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
        };
        _games.Add(game);
        var update = new EditTeamDto
        {
            DivisionId = _divisionId,
            SeasonId = _seasonId,
            Id = _team.Id,
            Address = "new address",
            Name = "new name",
            NewDivisionId = _divisionId,
        };
        _teamService.Setup(s => s.Get(awayTeam.Id, _token)).ReturnsAsync(awayTeam);

        var result = await _command.WithData(update).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Team updated"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_divisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
    }

    [Test]
    public async Task? ApplyUpdates_WhenAGameRefersToMissingTeam_IgnoresMissingTeam()
    {
        var awayTeamId = Guid.NewGuid();
        var game = new GameDto
        {
            Home = new GameTeamDto { Id = _team.Id },
            Away = new GameTeamDto { Id = awayTeamId, Name = "away team" },
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
        };
        _games.Add(game);
        var update = new EditTeamDto
        {
            DivisionId = _divisionId,
            SeasonId = _seasonId,
            Id = _team.Id,
            Address = "new address",
            Name = "new name",
            NewDivisionId = _divisionId,
        };
        _teamService.Setup(s => s.Get(awayTeamId, _token)).ReturnsAsync(() => null);

        var result = await _command.WithData(update).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Team updated"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_divisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
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
}
