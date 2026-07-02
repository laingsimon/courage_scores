using AutoFixture;
using CourageScores.Filters;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Command;
using CourageScores.Services.Season;
using CourageScores.Services.Team;
using Moq;
using NUnit.Framework;
using CosmosSeason = CourageScores.Models.Cosmos.Season.Season;
using CosmosDivision = CourageScores.Models.Cosmos.Division;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateSeasonCommandTests
{
    private Mock<ICachingSeasonService> _seasonService = null!;
    private Mock<ITeamService> _teamService = null!;
    private Mock<AddSeasonToTeamCommand> _addSeasonToTeamCommand = null!;
    private readonly CancellationToken _token = CancellationToken.None;
    private AddOrUpdateSeasonCommand _command = null!;
    private CosmosSeason _season = null!;
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private CosmosDivision _division = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create().WithCacheManagementFlags(out _cacheFlags);
        _seasonService = fixture.FreezeMock<ICachingSeasonService>();
        _teamService = fixture.FreezeMock<ITeamService>();
        var commandFactory = fixture.FreezeMock<ICommandFactory>();
        var divisionRepository = fixture.FreezeMock<IGenericRepository<CosmosDivision>>();
        _addSeasonToTeamCommand = fixture.FreezeMockOf<AddSeasonToTeamCommand>();
        _division = new CosmosDivision
        {
            Id = Guid.NewGuid(),
        };
        _season = new CosmosSeason
        {
            Id = Guid.NewGuid(),
            Name = "SEASON",
            StartDate = new DateTime(2001, 02, 03),
            EndDate = new DateTime(2002, 03, 04),
            Divisions =
            {
                _division,
            },
        };
        _command = fixture.Create<AddOrUpdateSeasonCommand>();

        commandFactory.Setup(f => f.GetCommand<AddSeasonToTeamCommand>()).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.ForSeason(It.IsAny<Guid>())).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.ForDivision(It.IsAny<Guid>())).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.CopyPlayersFromSeasonId(It.IsAny<Guid>())).Returns(_addSeasonToTeamCommand.Object);
        _addSeasonToTeamCommand.Setup(c => c.SkipSeasonExistenceCheck()).Returns(_addSeasonToTeamCommand.Object);
        divisionRepository.Setup(r => r.Get(_division.Id, _token)).ReturnsAsync(_division);
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
            DivisionIds =
            {
                _division.Id,
            },
            LastUpdated = _season.Updated,
            FixtureStartTime = TimeSpan.FromHours(20),
            FixtureDuration = 4,
        };

        var result = await _command.WithData(update).ApplyUpdate(_season, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(["Season updated"]));
        Assert.That(_season.Name, Is.EqualTo("NEW SEASON"));
        Assert.That(_season.StartDate, Is.EqualTo(new DateTime(2021, 02, 03)));
        Assert.That(_season.EndDate, Is.EqualTo(new DateTime(2022, 03, 04)));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
        Assert.That(_season.FixtureStartTime, Is.EqualTo(TimeSpan.FromHours(20)));
        Assert.That(_season.FixtureDuration, Is.EqualTo(4));
    }

    [Test]
    public async Task ApplyUpdate_GivenFixtureStartTimeAndDurationAreNull_UpdatesPropertiesToNull()
    {
        _season.FixtureStartTime = TimeSpan.FromHours(20);
        _season.FixtureDuration = 4;
        var update = new EditSeasonDto
        {
            Id = _season.Id,
            LastUpdated = _season.Updated,
        };

        var result = await _command.WithData(update).ApplyUpdate(_season, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(["Season updated"]));
        Assert.That(_season.FixtureStartTime, Is.Null);
        Assert.That(_season.FixtureDuration, Is.Null);
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
            LastUpdated = _season.Updated,
        };

        var result = await _command.WithData(update).ApplyUpdate(_season, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(["Season updated"]));
        Assert.That(_season.Name, Is.EqualTo("NEW SEASON"));
        Assert.That(_season.StartDate, Is.EqualTo(new DateTime(2021, 02, 03)));
        Assert.That(_season.EndDate, Is.EqualTo(new DateTime(2022, 03, 04)));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonDoesNotExist_SetsProperties()
    {
        _season = new CosmosSeason();
        var update = new EditSeasonDto
        {
            Name = "NEW SEASON",
            StartDate = new DateTime(2021, 02, 03),
            EndDate = new DateTime(2022, 03, 04),
        };

        var result = await _command.WithData(update).ApplyUpdate(_season, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(["Season updated"]));
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
            LastUpdated = _season.Updated,
        };
        _seasonService.Setup(s => s.Get(otherSeasonId, _token)).ReturnsAsync(() => null);

        var result = await _command.WithData(update).ApplyUpdate(_season, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(["Could not find season to copy teams from"]));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonDoesNotExist_CopiesNoTeamsFromOtherSeason()
    {
        var otherSeason = new SeasonDtoBuilder().Build();
        var update = new EditSeasonDto
        {
            Name = "NEW SEASON",
            StartDate = new DateTime(2021, 02, 03),
            EndDate = new DateTime(2022, 03, 04),
            CopyTeamsFromSeasonId = otherSeason.Id,
            LastUpdated = _season.Updated,
        };
        _seasonService.Setup(s => s.Get(otherSeason.Id, _token)).ReturnsAsync(otherSeason);
        _teamService.Setup(s => s.GetTeamsForSeason(otherSeason.Id, _token)).Returns(TestUtilities.AsyncEnumerable<TeamDto>());

        var result = await _command.WithData(update).ApplyUpdate(_season, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(["Copied 0 of 0 team/s from other season"]));
        Assert.That(_season.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(_season.Name, Is.EqualTo("NEW SEASON"));
        Assert.That(_season.StartDate, Is.EqualTo(new DateTime(2021, 02, 03)));
        Assert.That(_season.EndDate, Is.EqualTo(new DateTime(2022, 03, 04)));
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonDoesNotExist_CopiesAllTeamsFromOtherSeason()
    {
        var otherSeason = new SeasonDtoBuilder().Build();
        var update = new EditSeasonDto
        {
            Name = "NEW SEASON",
            StartDate = new DateTime(2021, 02, 03),
            EndDate = new DateTime(2022, 03, 04),
            CopyTeamsFromSeasonId = otherSeason.Id,
            LastUpdated = _season.Updated,
        };
        var otherSeasonTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = otherSeason.Id,
                    DivisionId = _division.Id,
                },
            },
        };
        _seasonService.Setup(s => s.Get(otherSeason.Id, _token)).ReturnsAsync(otherSeason);
        _teamService.Setup(s => s.GetTeamsForSeason(otherSeason.Id, _token)).Returns(TestUtilities.AsyncEnumerable(otherSeasonTeam));
        _teamService
            .Setup(s => s.Upsert(otherSeasonTeam.Id, _addSeasonToTeamCommand.Object, _token))
            .ReturnsAsync(new ActionResultDto<TeamDto>
            {
                Success = true,
            });

        var result = await _command.WithData(update).ApplyUpdate(_season, _token);

        _teamService
            .Verify(s => s.Upsert(otherSeasonTeam.Id, _addSeasonToTeamCommand.Object, _token));
        _addSeasonToTeamCommand.Verify(c => c.ForSeason(_season.Id));
        _addSeasonToTeamCommand.Verify(c => c.ForDivision(_division.Id));
        _addSeasonToTeamCommand.Verify(c => c.CopyPlayersFromSeasonId(otherSeason.Id));
        _addSeasonToTeamCommand.Verify(c => c.SkipSeasonExistenceCheck());
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(["Copied 1 of 1 team/s from other season"]));
        Assert.That(_season.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(_season.Name, Is.EqualTo("NEW SEASON"));
        Assert.That(_season.StartDate, Is.EqualTo(new DateTime(2021, 02, 03)));
        Assert.That(_season.EndDate, Is.EqualTo(new DateTime(2022, 03, 04)));
    }
}
