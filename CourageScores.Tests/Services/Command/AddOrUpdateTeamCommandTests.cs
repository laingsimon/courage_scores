using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Command;
using CourageScores.Services.Game;
using CourageScores.Services.Season;
using CourageScores.Services.Team;
using Moq;
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
    private List<GameDto> _games = null!;
    private Team _team = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _team = new Team
        {
            Id = Guid.NewGuid(),
            Name = "old name",
            Address = "old address",
            DivisionId = _divisionId,
        };
        _games = new List<GameDto>();

        _gameService = new Mock<IGameService>();
        _teamService = new Mock<ITeamService>();
        _commandFactory = new Mock<ICommandFactory>();
        _seasonService = new Mock<ISeasonService>();
        _command = new AddOrUpdateTeamCommand(_teamService.Object, _gameService.Object, _commandFactory.Object);
        _addOrUpdateGameCommand = new Mock<AddOrUpdateGameCommand>(_seasonService.Object, _commandFactory.Object, _teamService.Object);

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
        };

        var result = await _command.WithData(update).ApplyUpdate(_team, _token);

        Assert.That(_team.Name, Is.EqualTo(update.Name));
        Assert.That(_team.Address, Is.EqualTo(update.Address));
        Assert.That(_team.DivisionId, Is.EqualTo(update.DivisionId));
        Assert.That(result.Success, Is.True);
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
        };

        var result = await _command.WithData(update).ApplyUpdate(_team, _token);

        _addOrUpdateGameCommand.Verify(c => c.WithData(It.Is<EditGameDto>(dto => EditGameDtoMatches(dto, game, update))));
        _gameService.Verify(s => s.Upsert(game.Id, _addOrUpdateGameCommand.Object, _token));
        Assert.That(result.Success, Is.True);
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
        };

        var result = await _command.WithData(update).ApplyUpdate(_team, _token);

        _addOrUpdateGameCommand.Verify(c => c.WithData(It.Is<EditGameDto>(dto => EditGameDtoMatches(dto, game, update))));
        _gameService.Verify(s => s.Upsert(game.Id, _addOrUpdateGameCommand.Object, _token));
        Assert.That(result.Success, Is.True);
    }

    [TestCase("new address")]
    [TestCase("NEW ADDRESS")]
    public async Task ApplyUpdates_WhenHomeAddressIsUpdatedToSameAsAwayAddress_ReturnsFalse(string updateAddress)
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
        };
        _teamService.Setup(s => s.Get(otherTeam.Id, _token)).ReturnsAsync(otherTeam);

        var result = await _command.WithData(update).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Unable to update address, old name is playing other team (on Feb 03 2001) which is registered at the updated address"));
    }

    [TestCase("new address")]
    [TestCase("NEW ADDRESS")]
    public async Task ApplyUpdates_WhenAwayAddressIsUpdatedToSameAsHomeAddress_ReturnsFalse(string updateAddress)
    {
        var otherTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "new address",
        };
        var game = new GameDto
        {
            Home = new GameTeamDto { Id = _team.Id },
            Away = new GameTeamDto { Id = otherTeam.Id, Name = "other team" },
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
        };
        _teamService.Setup(s => s.Get(otherTeam.Id, _token)).ReturnsAsync(otherTeam);

        var result = await _command.WithData(update).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Unable to update address, old name is playing other team (on Feb 03 2001) which is registered at the updated address"));
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