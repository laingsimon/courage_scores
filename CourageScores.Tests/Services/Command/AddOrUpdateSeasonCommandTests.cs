using CourageScores.Filters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Season;
using CourageScores.Services.Team;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateSeasonCommandTests
{
    private Mock<ISeasonService> _seasonService = null!;
    private Mock<ITeamService> _teamService = null!;
    private Mock<ICommandFactory> _commandFactory = null!;
    private Mock<AddSeasonToTeamCommand> _addSeasonToTeamCommand = null!;
    private readonly CancellationToken _token = new CancellationToken();
    private AddOrUpdateSeasonCommand _command = null!;
    private Season _season = null!;
    private ScopedCacheManagementFlags _cacheFlags = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _seasonService = new Mock<ISeasonService>();
        _teamService = new Mock<ITeamService>();
        _commandFactory = new Mock<ICommandFactory>();
        _addSeasonToTeamCommand = new Mock<AddSeasonToTeamCommand>(new Mock<IAuditingHelper>().Object, _seasonService.Object, _cacheFlags);
        _season = new Season
        {
            Id = Guid.NewGuid(),
            Name = "SEASON",
            StartDate = new DateTime(2001, 02, 03),
            EndDate = new DateTime(2002, 03, 04),
        };
        _cacheFlags = new ScopedCacheManagementFlags();
        _command = new AddOrUpdateSeasonCommand(_seasonService.Object, _teamService.Object, _commandFactory.Object, _cacheFlags);

        _commandFactory.Setup(f => f.GetCommand<AddSeasonToTeamCommand>()).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.ForSeason(It.IsAny<Guid>())).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.CopyPlayersFromSeasonId(It.IsAny<Guid>())).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.SkipSeasonExistenceCheck()).Returns(_addSeasonToTeamCommand.Object);
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonExists_UpdatesProperties()
    {
        var update = new EditSeasonDto
        {
            Id = _season.Id,
            Name = "NEW SEASON",
            StartDate = new DateTime(2021, 02, 03),
            EndDate = new DateTime(2022, 03, 04),
        };

        var result = await _command.WithData(update).ApplyUpdate(_season, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Season updated"));
        Assert.That(_season.Name, Is.EqualTo("NEW SEASON"));
        Assert.That(_season.StartDate, Is.EqualTo(new DateTime(2021, 02, 03)));
        Assert.That(_season.EndDate, Is.EqualTo(new DateTime(2022, 03, 04)));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonExists_IgnoresCopyFromOtherSeasonProperty()
    {
        var update = new EditSeasonDto
        {
            Id = _season.Id,
            Name = "NEW SEASON",
            StartDate = new DateTime(2021, 02, 03),
            EndDate = new DateTime(2022, 03, 04),
            CopyTeamsFromSeasonId = Guid.NewGuid(),
        };

        var result = await _command.WithData(update).ApplyUpdate(_season, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Season updated"));
        Assert.That(_season.Name, Is.EqualTo("NEW SEASON"));
        Assert.That(_season.StartDate, Is.EqualTo(new DateTime(2021, 02, 03)));
        Assert.That(_season.EndDate, Is.EqualTo(new DateTime(2022, 03, 04)));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonDoesNotExist_SetsProperties()
    {
        _season = new Season();
        var update = new EditSeasonDto
        {
            Name = "NEW SEASON",
            StartDate = new DateTime(2021, 02, 03),
            EndDate = new DateTime(2022, 03, 04),
        };

        var result = await _command.WithData(update).ApplyUpdate(_season, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Season created"));
        Assert.That(_season.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(_season.Name, Is.EqualTo("NEW SEASON"));
        Assert.That(_season.StartDate, Is.EqualTo(new DateTime(2021, 02, 03)));
        Assert.That(_season.EndDate, Is.EqualTo(new DateTime(2022, 03, 04)));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonDoesNotExist_ReturnsErrorIfOtherTeamDoesNotExist()
    {
        var otherSeasonId = Guid.NewGuid();
        var update = new EditSeasonDto
        {
            Name = "NEW SEASON",
            StartDate = new DateTime(2021, 02, 03),
            EndDate = new DateTime(2022, 03, 04),
            CopyTeamsFromSeasonId = otherSeasonId,
        };
        _seasonService.Setup(s => s.Get(otherSeasonId, _token)).ReturnsAsync(() => null);

        var result = await _command.WithData(update).ApplyUpdate(_season, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Could not find season to copy teams from"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonDoesNotExist_CopiesNoTeamsFromOtherSeason()
    {
        var otherSeason = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var update = new EditSeasonDto
        {
            Name = "NEW SEASON",
            StartDate = new DateTime(2021, 02, 03),
            EndDate = new DateTime(2022, 03, 04),
            CopyTeamsFromSeasonId = otherSeason.Id,
        };
        _seasonService.Setup(s => s.Get(otherSeason.Id, _token)).ReturnsAsync(otherSeason);
        _teamService.Setup(s => s.GetTeamsForSeason(otherSeason.Id, _token)).Returns(TestUtilities.AsyncEnumerable<TeamDto>());

        var result = await _command.WithData(update).ApplyUpdate(_season, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Copied 0 of 0 team/s from other season"));
        Assert.That(_season.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(_season.Name, Is.EqualTo("NEW SEASON"));
        Assert.That(_season.StartDate, Is.EqualTo(new DateTime(2021, 02, 03)));
        Assert.That(_season.EndDate, Is.EqualTo(new DateTime(2022, 03, 04)));
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonDoesNotExist_CopiesAllTeamsFromOtherSeason()
    {
        var otherSeason = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var update = new EditSeasonDto
        {
            Name = "NEW SEASON",
            StartDate = new DateTime(2021, 02, 03),
            EndDate = new DateTime(2022, 03, 04),
            CopyTeamsFromSeasonId = otherSeason.Id,
        };
        var otherSeasonTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
        };
        _seasonService.Setup(s => s.Get(otherSeason.Id, _token)).ReturnsAsync(otherSeason);
        _teamService.Setup(s => s.GetTeamsForSeason(otherSeason.Id, _token)).Returns(TestUtilities.AsyncEnumerable(otherSeasonTeam));
        _teamService
            .Setup(s => s.Upsert(otherSeasonTeam.Id, _addSeasonToTeamCommand.Object, _token))
            .ReturnsAsync(new ActionResultDto<TeamDto> { Success = true });

        var result = await _command.WithData(update).ApplyUpdate(_season, _token);

        _teamService
            .Verify(s => s.Upsert(otherSeasonTeam.Id, _addSeasonToTeamCommand.Object, _token));
        _addSeasonToTeamCommand.Verify(c => c.ForSeason(_season.Id));
        _addSeasonToTeamCommand.Verify(c => c.CopyPlayersFromSeasonId(otherSeason.Id));
        _addSeasonToTeamCommand.Verify(c => c.SkipSeasonExistenceCheck());
        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Copied 1 of 1 team/s from other season"));
        Assert.That(_season.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(_season.Name, Is.EqualTo("NEW SEASON"));
        Assert.That(_season.StartDate, Is.EqualTo(new DateTime(2021, 02, 03)));
        Assert.That(_season.EndDate, Is.EqualTo(new DateTime(2022, 03, 04)));
    }
}