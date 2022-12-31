using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Season;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateGameCommandTests
{
    private Mock<IGenericRepository<Season>> _seasonRepository = null!;
    private Mock<ICommandFactory> _commandFactory = null!;
    private Mock<ITeamService> _teamService = null!;
    private CancellationToken _token;
    private AddOrUpdateGameCommand _command = null!;
    private readonly Game _game;
    private readonly Season _season;
    private readonly TeamDto _homeTeam;
    private readonly TeamDto _awayTeam;
    private readonly TeamSeasonDto _teamSeason;
    private Mock<AddSeasonToTeamCommand> _addSeasonToTeamCommand = null!;

    public AddOrUpdateGameCommandTests()
    {
        _game = new Game
        {
            Id = Guid.NewGuid(),
        };
        _season = new Season
        {
            Id = Guid.NewGuid(),
        };
        _teamSeason = new TeamSeasonDto
        {
            SeasonId = _season.Id,
        };
        _homeTeam = new TeamDto { Id = Guid.NewGuid(), Created = DateTime.Now, Updated = DateTime.Now };
        _awayTeam = new TeamDto { Id = Guid.NewGuid(), Created = DateTime.Now, Updated = DateTime.Now };
    }

    [SetUp]
    public void SetupEachTest()
    {
        _seasonRepository = new Mock<IGenericRepository<Season>>();
        _commandFactory = new Mock<ICommandFactory>();
        _teamService = new Mock<ITeamService>();
        _token = new CancellationToken();
        _addSeasonToTeamCommand = new Mock<AddSeasonToTeamCommand>(new Mock<IAuditingHelper>().Object, new Mock<ISeasonService>().Object);
        _commandFactory.Setup(f => f.GetCommand<AddSeasonToTeamCommand>()).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.ForSeason(_season.Id)).Returns(_addSeasonToTeamCommand.Object);

        _command = new AddOrUpdateGameCommand(
            _seasonRepository.Object,
            _commandFactory.Object,
            _teamService.Object);
    }

    [Test]
    public async Task ApplyUpdates_WithSameHomeAndAwayTeamIds_ShouldReturnFalse()
    {
        var sameId = Guid.NewGuid();
        var update = new EditGameDto
        {
            HomeTeamId = sameId,
            AwayTeamId = sameId,
        };

        var result = await _command.WithData(update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Unable to update a game where the home team and away team are the same"));
    }

    [Test]
    public async Task ApplyUpdates_WithNoSeasons_ReturnsUnsuccessful()
    {
        var update = new EditGameDto
        {
            HomeTeamId = _homeTeam.Id,
            AwayTeamId = _awayTeam.Id,
        };
        _seasonRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<Season>());

        var result = await _command.WithData(update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Unable to add or update game, no season exists"));
    }

    [Test]
    public async Task ApplyUpdates_WithSeasons_ThenUpdatesGame()
    {
        var update = new EditGameDto
        {
            HomeTeamId = _homeTeam.Id,
            AwayTeamId = _awayTeam.Id,
            Address = "new address",
            Date = new DateTime(2001, 02, 03, 04, 05, 06),
            Postponed = true,
            DivisionId = Guid.NewGuid(),
            IsKnockout = true,
            Id = _game.Id,
        };
        _homeTeam.Seasons.Add(_teamSeason);
        _awayTeam.Seasons.Add(_teamSeason);
        _seasonRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_season));
        _teamService.Setup(s => s.Get(update.HomeTeamId, _token)).ReturnsAsync(_homeTeam);
        _teamService.Setup(s => s.Get(update.AwayTeamId, _token)).ReturnsAsync(_awayTeam);

        var result = await _command.WithData(update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_game.Address, Is.EqualTo(update.Address));
        Assert.That(_game.Date, Is.EqualTo(update.Date));
        Assert.That(_game.Postponed, Is.EqualTo(update.Postponed));
        Assert.That(_game.IsKnockout, Is.EqualTo(update.IsKnockout));
        Assert.That(_game.DivisionId, Is.EqualTo(update.DivisionId));
    }

    [Test]
    public async Task ApplyUpdates_WhenTeamsNotRegisteredToSeason_ThenRegistersTeamsWithSeason()
    {
        var update = new EditGameDto
        {
            HomeTeamId = _homeTeam.Id,
            AwayTeamId = _awayTeam.Id,
            Id = _game.Id,
        };
        var success = new ActionResultDto<TeamDto>
        {
            Success = true,
        };
        _seasonRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_season));
        _teamService.Setup(s => s.Get(update.HomeTeamId, _token)).ReturnsAsync(_homeTeam);
        _teamService.Setup(s => s.Get(update.AwayTeamId, _token)).ReturnsAsync(_awayTeam);
        _teamService.Setup(s => s.Upsert(_homeTeam.Id, _addSeasonToTeamCommand.Object, _token)).ReturnsAsync(success);
        _teamService.Setup(s => s.Upsert(_awayTeam.Id, _addSeasonToTeamCommand.Object, _token)).ReturnsAsync(success);

        var result = await _command.WithData(update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        _addSeasonToTeamCommand.Verify(c => c.ForSeason(_season.Id));
        _teamService.Verify(s => s.Upsert(_homeTeam.Id, _addSeasonToTeamCommand.Object, _token));
        _teamService.Verify(s => s.Upsert(_awayTeam.Id, _addSeasonToTeamCommand.Object, _token));
    }

    [Test]
    public async Task ApplyUpdates_WhenTeamsFailDuringRegistrationToSeason_ThenThrows()
    {
        var update = new EditGameDto
        {
            HomeTeamId = _homeTeam.Id,
            AwayTeamId = _awayTeam.Id,
            Id = _game.Id,
        };
        var fail = new ActionResultDto<TeamDto>
        {
            Success = false,
            Errors = { "Some error1", "Some error2" },
            Warnings = { "Some warning" },
            Messages = { "Some message" },
        };
        _seasonRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_season));
        _teamService.Setup(s => s.Get(update.HomeTeamId, _token)).ReturnsAsync(_homeTeam);
        _teamService.Setup(s => s.Upsert(_homeTeam.Id, _addSeasonToTeamCommand.Object, _token)).ReturnsAsync(fail);

        InvalidOperationException? thrownException = null;
        try
        {
            await _command.WithData(update).ApplyUpdate(_game, _token);
        }
        catch (InvalidOperationException exc)
        {
            thrownException = exc;
        }

        Assert.That(thrownException, Is.Not.Null);
        Assert.That(thrownException!.Message, Is.EqualTo("Could not add season to team: Some error1, Some error2"));
        _addSeasonToTeamCommand.Verify(c => c.ForSeason(_season.Id));
        _teamService.Verify(s => s.Upsert(_homeTeam.Id, _addSeasonToTeamCommand.Object, _token));
    }
}