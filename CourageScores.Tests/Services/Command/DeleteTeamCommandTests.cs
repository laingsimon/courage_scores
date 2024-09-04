using CourageScores.Filters;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class DeleteTeamCommandTests
{
    private Mock<IUserService> _userService = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private readonly CancellationToken _token = new();
    private readonly Guid _seasonId = Guid.NewGuid();
    private DeleteTeamCommand _command = null!;
    private CosmosTeam _team = null!;
    private UserDto? _user;
    private ScopedCacheManagementFlags _cacheFlags = null!;

    [SetUp]
    public void SetUpEachTest()
    {
        _cacheFlags = new ScopedCacheManagementFlags();
        _userService = new Mock<IUserService>();
        _auditingHelper = new Mock<IAuditingHelper>();
        _command = new DeleteTeamCommand(_userService.Object, _auditingHelper.Object, _cacheFlags);
        _team = new CosmosTeam();
        _user = _user.SetAccess(manageTeams: true);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamIsDeleted_DoesNothing()
    {
        _team.Deleted = new DateTime(2001, 02, 03);

        var result = await _command.FromSeason(_seasonId).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Team has already been deleted",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenNotLoggedIn_ReturnsNotPermitted()
    {
        _user = null;

        var result = await _command.FromSeason(_seasonId).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Not permitted",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenNoAccess_ReturnsNotPermitted()
    {
        _user = new UserDto
        {
            Access = null,
        };

        var result = await _command.FromSeason(_seasonId).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Not permitted",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenNotPermitted_ReturnsNotPermitted()
    {
        _user.SetAccess(manageTeams: false);

        var result = await _command.FromSeason(_seasonId).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Not permitted",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenUndeletedTeamSeasonExists_DeletesTeamSeason()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = _seasonId,
            Deleted = null,
        };
        _team.Seasons.Add(teamSeason);
        _team.Seasons.Add(new TeamSeason());
        _auditingHelper.Setup(h => h.SetDeleted(_team, _token)).Callback(() => teamSeason.Deleted = new DateTime(2001, 02, 03));

        await _command.FromSeason(_seasonId).ApplyUpdate(_team, _token);

        _auditingHelper.Verify(h => h.SetDeleted(teamSeason, _token));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
    }

    [Test]
    public async Task ApplyUpdate_WhenDeletedTeamSeasonExists_LeavesTeamSeasonAsIs()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = _seasonId,
            Deleted = new DateTime(2001, 02, 03),
        };
        _team.Seasons.Add(teamSeason);
        _team.Seasons.Add(new TeamSeason());
        _auditingHelper.Setup(h => h.SetDeleted(_team, _token)).Callback(() => teamSeason.Deleted = new DateTime(2001, 02, 03));

        await _command.FromSeason(_seasonId).ApplyUpdate(_team, _token);

        _auditingHelper.Verify(h => h.SetDeleted(teamSeason, _token), Times.Never);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamAllocatedToAnotherSeason_ReturnsFalse()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = _seasonId,
            Deleted = new DateTime(2001, 02, 03),
        };
        _team.Seasons.Add(teamSeason);
        _team.Seasons.Add(new TeamSeason());
        _auditingHelper.Setup(h => h.SetDeleted(_team, _token)).Callback(() => teamSeason.Deleted = new DateTime(2001, 02, 03));

        var result = await _command.FromSeason(_seasonId).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "Team allocated to other season/s",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamNotAllocatedToAnyOtherSeason_ReturnsTrue()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = _seasonId,
            Deleted = null,
        };
        _team.Seasons.Add(teamSeason);
        _team.Seasons.Add(new TeamSeason());
        _auditingHelper.Setup(h => h.SetDeleted(_team, _token)).Callback(() => teamSeason.Deleted = new DateTime(2001, 02, 03));

        var result = await _command.FromSeason(_seasonId).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Removed team from 1 season/s",
        }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
    }

    [Test]
    public async Task ApplyUpdate_WhenNoRemainingTeamSeasonsButDeleteNotRequested_DoesNotDeleteTeam()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = Guid.NewGuid(),
            Deleted = new DateTime(2001, 02, 03),
        };
        _team.Seasons.Add(teamSeason);

        var result = await _command.FromSeason(_seasonId).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Removed team from 0 season/s",
        }));
        Assert.That(result.Delete, Is.False);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
    }

    [Test]
    public async Task ApplyUpdate_WhenNoRemainingTeamSeasonsAndDeleteRequested_ThenDeletesTeam()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = Guid.NewGuid(),
            Deleted = new DateTime(2001, 02, 03),
        };
        _team.Seasons.Add(teamSeason);

        var result = await _command.FromSeason(_seasonId).DeleteIfNoSeasonsAssigned().ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Team deleted",
        }));
        Assert.That(result.Delete, Is.True);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
    }

    [Test]
    public async Task ApplyUpdate_WhenLastTeamSeasonDeletedButDeleteNotRequested_ThenRemovesSeasonButDoesNotDeleteTeam()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = _seasonId,
            Deleted = null,
        };
        _team.Seasons.Add(teamSeason);
        _auditingHelper.Setup(h => h.SetDeleted(teamSeason, _token)).Callback(() => teamSeason.Deleted = new DateTime(2001, 02, 03));

        var result = await _command.FromSeason(_seasonId).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Removed team from 1 season/s",
        }));
        Assert.That(result.Delete, Is.False);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
    }

    [Test]
    public async Task ApplyUpdate_WhenLastTeamSeasonDeletedAndDeleteRequested_ThenDeletesTeam()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = _seasonId,
            Deleted = null,
        };
        _team.Seasons.Add(teamSeason);
        _auditingHelper.Setup(h => h.SetDeleted(teamSeason, _token)).Callback(() => teamSeason.Deleted = new DateTime(2001, 02, 03));

        var result = await _command.FromSeason(_seasonId).DeleteIfNoSeasonsAssigned().ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Removed team from 1 season/s, and team deleted",
        }));
        Assert.That(result.Delete, Is.True);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonsMatchAndNotPermittedToDeleteTeamEntirelyButDeleteNotRequested_ThenSuccessful()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = _seasonId,
            Deleted = null,
        };
        _team.Seasons.Add(teamSeason);
        _auditingHelper.Setup(h => h.SetDeleted(teamSeason, _token)).Callback(() =>
        {
            _user.SetAccess(manageTeams: false); // change the permissions part way through
            teamSeason.Deleted = new DateTime(2001, 02, 03);
        });

        var result = await _command.FromSeason(_seasonId).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Removed team from 1 season/s",
        }));
        Assert.That(result.Delete, Is.False);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonsMatchAndNotPermittedToDeleteTeamEntirelyAndDeleteRequested_ThenSuccessful()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = _seasonId,
            Deleted = null,
        };
        _team.Seasons.Add(teamSeason);
        _auditingHelper.Setup(h => h.SetDeleted(teamSeason, _token)).Callback(() =>
        {
            _user.SetAccess(manageTeams: false); // change the permissions part way through
            teamSeason.Deleted = new DateTime(2001, 02, 03);
        });

        var result = await _command.FromSeason(_seasonId).DeleteIfNoSeasonsAssigned().ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Removed team from 1 season/s, not permitted to delete the team entirely",
        }));
        Assert.That(result.Delete, Is.False);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_seasonId));
    }
}