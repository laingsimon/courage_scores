using CourageScores.Filters;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Season;
using Moq;
using NUnit.Framework;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddSeasonToTeamCommandTests
{
    private static readonly TeamPlayer DeletedPlayer = new TeamPlayer
    {
        Id = Guid.NewGuid(),
        Name = "deleted player",
        Deleted = new DateTime(2001, 02, 03),
    };
    private static readonly TeamPlayer OtherPlayer = new TeamPlayer
    {
        Id = Guid.NewGuid(),
        Name = "other player",
    };
    private static readonly TeamPlayer ExistingPlayer = new TeamPlayer
    {
        Id = Guid.NewGuid(),
        Name = "existing player",
    };
    private static readonly TeamSeason OtherSeason = new TeamSeason
    {
        SeasonId = Guid.NewGuid(),
        Players = { OtherPlayer },
    };

    private Mock<IAuditingHelper> _auditingHelper = null!;
    private Mock<ICachingSeasonService> _seasonService = null!;
    private readonly CancellationToken _token = new();
    private AddSeasonToTeamCommand _command = null!;
    private CosmosTeam _team = null!;
    private SeasonDto _season = null!;
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private DivisionDto _division = null!;

    [SetUp]
    public void SetupOnce()
    {
        _cacheFlags = new ScopedCacheManagementFlags();
        _auditingHelper = new Mock<IAuditingHelper>();
        _seasonService = new Mock<ICachingSeasonService>();
        _command = new AddSeasonToTeamCommand(_auditingHelper.Object, _seasonService.Object, _cacheFlags);
        _team = new CosmosTeam
        {
            Id = Guid.NewGuid(),
            Name = "TEAM",
        };
        _season = new SeasonDtoBuilder().Build();
        _division = new DivisionDtoBuilder().Build();
    }

    [Test]
    public async Task ApplyUpdate_WhenModelDeleted_ReturnsUnsuccessful()
    {
        _team.Deleted = new DateTime(2001, 02, 03);

        var result = await _command.ForSeason(_season.Id).ForDivision(_division.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Cannot edit a team that has been deleted" }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonNotFound_ReturnsUnsuccessful()
    {
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(() => null);

        var result = await _command.ForSeason(_season.Id).ForDivision(_division.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[] { "Season not found" }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenSkippingSeasonExistingCheck_ReturnsSuccessful()
    {
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(() => null);

        var result = await _command.ForSeason(_season.Id).ForDivision(_division.Id).SkipSeasonExistenceCheck().ApplyUpdate(_team, _token);

        _seasonService.Verify(s => s.Get(_season.Id, _token), Times.Never);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Season added to the TEAM team" }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_division.Id));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonFoundAndCopyFromOtherSeason_CopiesPlayersFromOtherSeason()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = _season.Id,
        };
        _team.Seasons.AddRange(new[] { teamSeason, OtherSeason });
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(OtherSeason.SeasonId)
            .ForSeason(_season.Id)
            .ForDivision(_division.Id)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Season already exists, 1 players copied" }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_division.Id));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
        Assert.That(teamSeason.DivisionId, Is.EqualTo(_division.Id));
        _auditingHelper.Verify(h => h.SetUpdated(teamSeason, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenDeletedTeamSeasonFoundAndCopyFromOtherSeason_UpdatesTeamSeason()
    {
        var otherSeasonWithDeletedPlayer = new TeamSeason
        {
            SeasonId = Guid.NewGuid(),
            Players =
            {
                OtherPlayer,
                DeletedPlayer,
            },
        };
        var teamSeason = new TeamSeason
        {
            SeasonId = _season.Id,
            Deleted = new DateTime(2001, 02, 03),
        };
        _team.Seasons.AddRange(new[] { teamSeason, otherSeasonWithDeletedPlayer });
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(otherSeasonWithDeletedPlayer.SeasonId)
            .ForSeason(_season.Id)
            .ForDivision(_division.Id)
            .ApplyUpdate(_team, _token);

        _auditingHelper.Verify(h => h.SetUpdated(teamSeason, _token)); // will undelete the TeamSeason
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Season already exists, 1 players copied" }));
        Assert.That(teamSeason.DivisionId, Is.EqualTo(_division.Id));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonFoundAndCopyFromOtherSeasonWithSomeCurrentPlayers_ReturnsSuccessful()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = _season.Id,
            Players = { ExistingPlayer },
        };
        _team.Seasons.AddRange(new[] { teamSeason, OtherSeason });
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(OtherSeason.SeasonId)
            .ForSeason(_season.Id)
            .ForDivision(_division.Id)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Season already exists" }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
        Assert.That(teamSeason.DivisionId, Is.EqualTo(_division.Id));
        _auditingHelper.Verify(h => h.SetUpdated(teamSeason, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonFoundAndCopyFromOtherSeasonWithSomeDeletedPlayers_ReturnsSuccessful()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = _season.Id,
            Players = { DeletedPlayer },
        };
        _team.Seasons.AddRange(new[] { teamSeason, OtherSeason });
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(OtherSeason.SeasonId)
            .ForSeason(_season.Id)
            .ForDivision(_division.Id)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Season already exists, 1 players copied" }));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_division.Id));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
        Assert.That(teamSeason.DivisionId, Is.EqualTo(_division.Id));
        _auditingHelper.Verify(h => h.SetUpdated(teamSeason, _token));
    }

    [Test]
    public async Task ApplyUpdate_WhenDeletedTeamSeasonFoundAndCopyFromOtherSeasonWithSomeCurrentPlayers_UpdatesTeamSeason()
    {
        var teamSeason = new TeamSeason
        {
            SeasonId = _season.Id,
            Players = { ExistingPlayer },
            Deleted = new DateTime(2001, 02, 03),
        };
        _team.Seasons.AddRange(new[] { teamSeason, OtherSeason });
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(OtherSeason.SeasonId)
            .ForSeason(_season.Id)
            .ForDivision(_division.Id)
            .ApplyUpdate(_team, _token);

        _auditingHelper.Verify(h => h.SetUpdated(teamSeason, _token)); // this will undelete the TeamSeason
        Assert.That(teamSeason.DivisionId, Is.EqualTo(_division.Id));
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonNotFoundAndCopyFromOtherSeason_CreatesTeamSeasonWithOtherSeasonPlayers()
    {
        _team.Seasons.Add(OtherSeason);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(OtherSeason.SeasonId)
            .ForSeason(_season.Id)
            .ForDivision(_division.Id)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Season added to the TEAM team, 1 players copied" }));
        var newTeamSeason = _team.Seasons.SingleOrDefault(s => s.SeasonId == _season.Id);
        Assert.That(newTeamSeason, Is.Not.Null);
        Assert.That(newTeamSeason!.Players, Is.Not.Empty);
        Assert.That(newTeamSeason.DivisionId, Is.EqualTo(_division.Id));
        Assert.That(newTeamSeason.Players.Select(p => p.Id), Is.EquivalentTo(OtherSeason.Players.Select(p => p.Id)));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_division.Id));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonNotFound_CreatesTeamSeason()
    {
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .ForSeason(_season.Id)
            .ForDivision(_division.Id)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Season added to the TEAM team" }));
        var newTeamSeason = _team.Seasons.SingleOrDefault(s => s.SeasonId == _season.Id);
        Assert.That(newTeamSeason, Is.Not.Null);
        Assert.That(newTeamSeason!.Players, Is.Empty);
        Assert.That(newTeamSeason.DivisionId, Is.EqualTo(_division.Id));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_division.Id));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_season.Id));
    }
}