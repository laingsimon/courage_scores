using CourageScores.Filters;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Season;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddSeasonToTeamCommandTests
{
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private Mock<ISeasonService> _seasonService = null!;
    private readonly CancellationToken _token = new CancellationToken();
    private AddSeasonToTeamCommand _command = null!;
    private CourageScores.Models.Cosmos.Team.Team _team = null!;
    private SeasonDto _season = null!;
    private ScopedCacheManagementFlags _cacheFlags = null!;

    [SetUp]
    public void SetupOnce()
    {
        _cacheFlags = new ScopedCacheManagementFlags();
        _auditingHelper = new Mock<IAuditingHelper>();
        _seasonService = new Mock<ISeasonService>();
        _command = new AddSeasonToTeamCommand(_auditingHelper.Object, _seasonService.Object, _cacheFlags);
        _team = new CourageScores.Models.Cosmos.Team.Team
        {
            Id = Guid.NewGuid(),
            Name = "TEAM",
        };
        _season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
    }

    [Test]
    public async Task ApplyUpdate_WhenModelDeleted_ReturnsUnsuccessful()
    {
        _team.Deleted = new DateTime(2001, 02, 03);

        var result = await _command.ForSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Cannot edit a team that has been deleted"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonNotFound_ReturnsUnsuccessful()
    {
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(() => null);

        var result = await _command.ForSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Season not found"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenSkippingSeasonExistingCheck_ReturnsSuccessful()
    {
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(() => null);

        var result = await _command.ForSeason(_season.Id).SkipSeasonExistenceCheck().ApplyUpdate(_team, _token);

        _seasonService.Verify(s => s.Get(_season.Id, _token), Times.Never);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Season added to the TEAM team"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonFoundAndCopyFromOtherSeason_CopiesPlayersFromOtherSeason()
    {
        var otherSeason = new TeamSeason
        {
            SeasonId = Guid.NewGuid(),
            Players =
            {
                new TeamPlayer {Id = Guid.NewGuid(), Name = "other player"}
            }
        };
        var teamSeason = new TeamSeason
        {
            SeasonId = _season.Id,
        };
        _team.Seasons.Add(teamSeason);
        _team.Seasons.Add(otherSeason);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(otherSeason.SeasonId)
            .ForSeason(_season.Id)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Season already exists, 1 players copied"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
        _auditingHelper.Verify(h => h.SetUpdated(teamSeason, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenDeletedTeamSeasonFoundAndCopyFromOtherSeason_UpdatesTeamSeason()
    {
        var otherSeason = new TeamSeason
        {
            SeasonId = Guid.NewGuid(),
            Players =
            {
                new TeamPlayer {Id = Guid.NewGuid(), Name = "other player"}
            }
        };
        var teamSeason = new TeamSeason
        {
            SeasonId = _season.Id,
            Deleted = new DateTime(2001, 02, 03),
        };
        _team.Seasons.Add(teamSeason);
        _team.Seasons.Add(otherSeason);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(otherSeason.SeasonId)
            .ForSeason(_season.Id)
            .ApplyUpdate(_team, _token);

        _auditingHelper.Verify(h => h.SetUpdated(teamSeason, _token)); // will undelete the TeamSeason
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonFoundAndCopyFromOtherSeasonWithSomeCurrentPlayers_ReturnsSuccessful()
    {
        var otherSeason = new TeamSeason
        {
            SeasonId = Guid.NewGuid(),
            Players =
            {
                new TeamPlayer {Id = Guid.NewGuid(), Name = "other player"}
            }
        };
        var teamSeason = new TeamSeason
        {
            SeasonId = _season.Id,
            Players =
            {
                new TeamPlayer { Id = Guid.NewGuid(), Name = "existing player" }
            }
        };
        _team.Seasons.Add(teamSeason);
        _team.Seasons.Add(otherSeason);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(otherSeason.SeasonId)
            .ForSeason(_season.Id)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Season already exists"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
        _auditingHelper.Verify(h => h.SetUpdated(teamSeason, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenDeletedTeamSeasonFoundAndCopyFromOtherSeasonWithSomeCurrentPlayers_UpdatesTeamSeason()
    {
        var otherSeason = new TeamSeason
        {
            SeasonId = Guid.NewGuid(),
            Players =
            {
                new TeamPlayer {Id = Guid.NewGuid(), Name = "other player"}
            }
        };
        var teamSeason = new TeamSeason
        {
            SeasonId = _season.Id,
            Players =
            {
                new TeamPlayer { Id = Guid.NewGuid(), Name = "existing player" }
            },
            Deleted = new DateTime(2001, 02, 03),
        };
        _team.Seasons.Add(teamSeason);
        _team.Seasons.Add(otherSeason);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(otherSeason.SeasonId)
            .ForSeason(_season.Id)
            .ApplyUpdate(_team, _token);

        _auditingHelper.Verify(h => h.SetUpdated(teamSeason, _token)); // this will undelete the TeamSeason
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonNotFoundAndCopyFromOtherSeason_CreatesTeamSeasonWithOtherSeasonPlayers()
    {
        var otherSeason = new TeamSeason
        {
            SeasonId = Guid.NewGuid(),
            Players =
            {
                new TeamPlayer {Id = Guid.NewGuid(), Name = "other player"}
            }
        };
        _team.Seasons.Add(otherSeason);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(otherSeason.SeasonId)
            .ForSeason(_season.Id)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Season added to the TEAM team, 1 players copied"));
        var newTeamSeason = _team.Seasons.SingleOrDefault(s => s.SeasonId == _season.Id);
        Assert.That(newTeamSeason, Is.Not.Null);
        Assert.That(newTeamSeason!.Players, Is.Not.Empty);
        Assert.That(newTeamSeason.Players.Select(p => p.Id), Is.EquivalentTo(otherSeason.Players.Select(p => p.Id)));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonNotFound_CreatesTeamSeason()
    {
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .ForSeason(_season.Id)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Season added to the TEAM team"));
        var newTeamSeason = _team.Seasons.SingleOrDefault(s => s.SeasonId == _season.Id);
        Assert.That(newTeamSeason, Is.Not.Null);
        Assert.That(newTeamSeason!.Players, Is.Empty);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
    }
}