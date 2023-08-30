using CourageScores.Filters;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Season;
using CourageScores.Services.Team;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateGameCommandTests
{
    private Mock<ICommandFactory> _commandFactory = null!;
    private Mock<ITeamService> _teamService = null!;
    private Mock<AddSeasonToTeamCommand> _addSeasonToTeamCommand = null!;
    private Mock<ICachingSeasonService> _seasonService = null!;
    private CancellationToken _token;
    private AddOrUpdateGameCommand _command = null!;
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private readonly CosmosGame _game;
    private readonly SeasonDto _season;
    private readonly TeamDto _homeTeam;
    private readonly TeamDto _awayTeam;
    private readonly TeamSeasonDto _teamSeason;

    public AddOrUpdateGameCommandTests()
    {
        _game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
        };
        _season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        _teamSeason = new TeamSeasonDto
        {
            SeasonId = _season.Id,
        };
        _homeTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Created = DateTime.Now,
            Updated = DateTime.Now,
        };
        _awayTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Created = DateTime.Now,
            Updated = DateTime.Now,
        };
    }

    [SetUp]
    public void SetupEachTest()
    {
        _seasonService = new Mock<ICachingSeasonService>();
        _commandFactory = new Mock<ICommandFactory>();
        _teamService = new Mock<ITeamService>();
        _token = new CancellationToken();
        _addSeasonToTeamCommand = new Mock<AddSeasonToTeamCommand>(new Mock<IAuditingHelper>().Object, _seasonService.Object, _cacheFlags);
        _commandFactory.Setup(f => f.GetCommand<AddSeasonToTeamCommand>()).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.ForSeason(_season.Id)).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.ForDivision(_game.DivisionId)).Returns(_addSeasonToTeamCommand.Object);
        _cacheFlags = new ScopedCacheManagementFlags();

        _command = new AddOrUpdateGameCommand(
            _seasonService.Object,
            _commandFactory.Object,
            _teamService.Object,
            _cacheFlags);
    }

    [Test]
    public async Task ApplyUpdates_WithSameHomeAndAwayTeamIds_ShouldReturnFalse()
    {
        var sameId = Guid.NewGuid();
        var update = new EditGameDto
        {
            HomeTeamId = sameId,
            AwayTeamId = sameId,
            SeasonId = Guid.NewGuid(),
            LastUpdated = _game.Updated,
        };

        var result = await _command.WithData(update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "Unable to update a game where the home team and away team are the same",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdates_WhenSeasonIdNotProvided_ReturnsUnsuccessful()
    {
        var update = new EditGameDto
        {
            HomeTeamId = _homeTeam.Id,
            AwayTeamId = _awayTeam.Id,
            SeasonId = Guid.Empty,
            LastUpdated = _game.Updated,
        };

        var result = await _command.WithData(update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "SeasonId must be provided",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdates_WhenSeasonNotFound_ReturnsUnsuccessful()
    {
        var update = new EditGameDto
        {
            HomeTeamId = _homeTeam.Id,
            AwayTeamId = _awayTeam.Id,
            SeasonId = Guid.NewGuid(),
            LastUpdated = _game.Updated,
        };
        _seasonService.Setup(s => s.Get(update.SeasonId, _token)).ReturnsAsync(() => null);

        var result = await _command.WithData(update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Unable to add or update game, season not found",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
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
            SeasonId = _season.Id,
            AccoladesCount = true,
            LastUpdated = _game.Updated,
        };
        _homeTeam.Seasons.Add(_teamSeason);
        _awayTeam.Seasons.Add(_teamSeason);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(() => _season);
        _teamService.Setup(s => s.Get(update.HomeTeamId, _token)).ReturnsAsync(_homeTeam);
        _teamService.Setup(s => s.Get(update.AwayTeamId, _token)).ReturnsAsync(_awayTeam);

        var result = await _command.WithData(update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_game.Address, Is.EqualTo(update.Address));
        Assert.That(_game.Date, Is.EqualTo(update.Date));
        Assert.That(_game.Postponed, Is.EqualTo(update.Postponed));
        Assert.That(_game.IsKnockout, Is.EqualTo(update.IsKnockout));
        Assert.That(_game.AccoladesCount, Is.EqualTo(update.AccoladesCount));
        Assert.That(_game.DivisionId, Is.EqualTo(update.DivisionId));
        Assert.That(_game.SeasonId, Is.EqualTo(update.SeasonId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_game.DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
    }

    [Test]
    public async Task ApplyUpdates_WhenTeamsNotRegisteredToSeason_ThenRegistersTeamsWithSeason()
    {
        var update = new EditGameDto
        {
            HomeTeamId = _homeTeam.Id,
            AwayTeamId = _awayTeam.Id,
            Id = _game.Id,
            SeasonId = _season.Id,
            LastUpdated = _game.Updated,
            DivisionId = _game.DivisionId,
        };
        var success = new ActionResultDto<TeamDto>
        {
            Success = true,
        };
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(() => _season);
        _teamService.Setup(s => s.Get(update.HomeTeamId, _token)).ReturnsAsync(_homeTeam);
        _teamService.Setup(s => s.Get(update.AwayTeamId, _token)).ReturnsAsync(_awayTeam);
        _teamService.Setup(s => s.Upsert(_homeTeam.Id, _addSeasonToTeamCommand.Object, _token)).ReturnsAsync(success);
        _teamService.Setup(s => s.Upsert(_awayTeam.Id, _addSeasonToTeamCommand.Object, _token)).ReturnsAsync(success);

        var result = await _command.WithData(update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        _addSeasonToTeamCommand.Verify(c => c.ForSeason(_season.Id));
        _teamService.Verify(s => s.Upsert(_homeTeam.Id, _addSeasonToTeamCommand.Object, _token));
        _teamService.Verify(s => s.Upsert(_awayTeam.Id, _addSeasonToTeamCommand.Object, _token));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_game.DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
    }

    [Test]
    public async Task ApplyUpdates_WhenTeamsFailDuringRegistrationToSeason_ThenThrows()
    {
        var update = new EditGameDto
        {
            HomeTeamId = _homeTeam.Id,
            AwayTeamId = _awayTeam.Id,
            Id = _game.Id,
            SeasonId = _season.Id,
            LastUpdated = _game.Updated,
            DivisionId = _game.DivisionId,
        };
        var fail = new ActionResultDto<TeamDto>
        {
            Success = false,
            Errors =
            {
                "Some error1",
                "Some error2",
            },
            Warnings =
            {
                "Some warning",
            },
            Messages =
            {
                "Some message",
            },
        };
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(() => _season);
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
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_game.DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
    }
}