using AutoFixture;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Season;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CourageScores.Tests.Services;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Season;

[TestFixture]
public class UpdateScoresAdapterTests
{
    private static readonly ScoreAsYouGo SaygModel = new ScoreAsYouGo();
    private static readonly ScoreAsYouGoDto SaygDto = new ScoreAsYouGoDto();
    private static readonly RecordScoresDto.RecordScoresGamePlayerDto HomePlayerDto = new() { Id = Guid.NewGuid(), Name = "HOME" };
    private static readonly RecordScoresDto.RecordScoresGamePlayerDto AwayPlayerDto = new() { Id = Guid.NewGuid(), Name = "AWAY" };

    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private UserDto? _user;
    private HashSet<AccessOption> _access = null!;

    private UpdateScoresAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _auditingHelper = fixture.FreezeMock<IAuditingHelper>();
        var userService = fixture.FreezeMock<IUserService>();
        _access = [AccessOption.RecordScoresAsYouGo];
        var accessService = fixture.FreezeMock<IAccessService>();
        fixture.Register<ISimpleAdapter<ScoreAsYouGo, ScoreAsYouGoDto>>(() => new MockSimpleAdapter<ScoreAsYouGo, ScoreAsYouGoDto>(SaygModel, SaygDto));
        _adapter = fixture.Create<UpdateScoresAdapter>();

        _user = new UserDto();
        userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        accessService
            .Setup(s => s.HasAccess(It.IsAny<UserDto?>(), It.IsAny<AccessOption>(), It.IsAny<UserAccessContext>(), _token))
            .ReturnsAsync((UserDto? _, AccessOption access, UserAccessContext _, CancellationToken _) => _user != null && _access.Contains(access));
    }

    [Test]
    public async Task AdaptToPlayer_GivenPlayer_AdaptsToGamePlayer()
    {
        var inputPlayer = new RecordScoresDto.RecordScoresGamePlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "PLAYER",
        };

        var result = await _adapter.AdaptToPlayer(inputPlayer, _token);

        Assert.That(result.Id, Is.EqualTo(inputPlayer.Id));
        Assert.That(result.Name, Is.EqualTo(inputPlayer.Name));
    }

    [Test]
    public async Task AdaptToPlayer_GivenPlayer_SetsUpdated()
    {
        var inputPlayer = new RecordScoresDto.RecordScoresGamePlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "PLAYER",
        };

        var result = await _adapter.AdaptToPlayer(inputPlayer, _token);

        _auditingHelper.Verify(h => h.SetUpdated(result, _token));
    }

    [Test]
    public async Task AdaptToHiCheckPlayer_GivenPlayer_AdaptsToNotablePlayer()
    {
        var inputPlayer = new RecordScoresDto.GameOver100CheckoutDto
        {
            Id = Guid.NewGuid(),
            Name = "PLAYER",
            Score = 120,
        };

        var result = await _adapter.AdaptToHiCheckPlayer(inputPlayer, _token);

        Assert.That(result.Id, Is.EqualTo(inputPlayer.Id));
        Assert.That(result.Name, Is.EqualTo(inputPlayer.Name));
        Assert.That(result.Notes, Is.EqualTo("120"));
    }

    [Test]
    public async Task AdaptToHiCheckPlayer_GivenPlayer_SetsUpdated()
    {
        var inputPlayer = new RecordScoresDto.GameOver100CheckoutDto
        {
            Id = Guid.NewGuid(),
            Name = "PLAYER",
            Score = 120,
        };

        var result = await _adapter.AdaptToHiCheckPlayer(inputPlayer, _token);

        _auditingHelper.Verify(h => h.SetUpdated(result, _token));
    }

    [Test]
    public async Task AdaptToMatch_WhenLoggedOut_AdaptsToMatch()
    {
        _user = null;
        var inputMatch = new RecordScoresDto.RecordScoresGameMatchDto
        {
            HomePlayers = { HomePlayerDto },
            AwayPlayers = { AwayPlayerDto },
            HomeScore = 1,
            AwayScore = 2,
            Sayg = SaygDto,
        };

        var result = await _adapter.AdaptToMatch(inputMatch, UserAccessContext.None(), _token);

        Assert.That(result.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(result.HomePlayers.Select(p => p.Id), Is.EqualTo([HomePlayerDto.Id]));
        Assert.That(result.AwayPlayers.Select(p => p.Id), Is.EqualTo([AwayPlayerDto.Id]));
        Assert.That(result.HomeScore, Is.EqualTo(inputMatch.HomeScore));
        Assert.That(result.AwayScore, Is.EqualTo(inputMatch.AwayScore));
        Assert.That(result.Sayg, Is.Null);
        _auditingHelper.Verify(h => h.SetUpdated(result, _token));
    }

    [Test]
    public async Task AdaptToMatch_WhenNotPermitted_AdaptsToMatch()
    {
        _access = _access.Without(AccessOption.RecordScoresAsYouGo);
        var inputMatch = new RecordScoresDto.RecordScoresGameMatchDto
        {
            HomePlayers = { HomePlayerDto },
            AwayPlayers = { AwayPlayerDto },
            HomeScore = 1,
            AwayScore = 2,
            Sayg = SaygDto,
        };

        var result = await _adapter.AdaptToMatch(inputMatch, UserAccessContext.None(), _token);

        Assert.That(result.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(result.HomePlayers.Select(p => p.Id), Is.EqualTo([HomePlayerDto.Id]));
        Assert.That(result.AwayPlayers.Select(p => p.Id), Is.EqualTo([AwayPlayerDto.Id]));
        Assert.That(result.HomeScore, Is.EqualTo(inputMatch.HomeScore));
        Assert.That(result.AwayScore, Is.EqualTo(inputMatch.AwayScore));
        Assert.That(result.Sayg, Is.Null);
        _auditingHelper.Verify(h => h.SetUpdated(result, _token));
    }

    [Test]
    public async Task AdaptToMatch_WhenPermitted_AdaptsToMatchWithSaygModel()
    {
        var inputMatch = new RecordScoresDto.RecordScoresGameMatchDto
        {
            HomePlayers = { HomePlayerDto },
            AwayPlayers = { AwayPlayerDto },
            HomeScore = 1,
            AwayScore = 2,
            Sayg = SaygDto,
        };

        var result = await _adapter.AdaptToMatch(inputMatch, UserAccessContext.None(), _token);

        Assert.That(result.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(result.HomePlayers.Select(p => p.Id), Is.EqualTo([HomePlayerDto.Id]));
        Assert.That(result.AwayPlayers.Select(p => p.Id), Is.EqualTo([AwayPlayerDto.Id]));
        Assert.That(result.HomeScore, Is.EqualTo(inputMatch.HomeScore));
        Assert.That(result.AwayScore, Is.EqualTo(inputMatch.AwayScore));
        Assert.That(result.Sayg, Is.SameAs(SaygModel));
        _auditingHelper.Verify(h => h.SetUpdated(result, _token));
    }

    [Test]
    public async Task UpdateMatch_WhenLoggedOut_AdaptsToMatch()
    {
        _user = null;
        var currentMatch = new GameMatch
        {
            Id = Guid.NewGuid(),
            HomeScore = 1,
            AwayScore = 2,
            Sayg = null,
            HomePlayers = { new GamePlayer { Name = "OLD HOME PLAYER" } },
            AwayPlayers = { new GamePlayer { Name = "OLD AWAY PLAYER" } },
            Created = new DateTime(2001, 02, 03),
            Author = "AUTHOR",
            Deleted = new DateTime(2002, 03, 04),
            Remover = "REMOVER",
            Version = 2,
        };
        var updatedMatch = new RecordScoresDto.RecordScoresGameMatchDto
        {
            HomePlayers = { HomePlayerDto },
            AwayPlayers = { AwayPlayerDto },
            HomeScore = 2,
            AwayScore = 3,
            Sayg = SaygDto,
        };

        var result = await _adapter.UpdateMatch(currentMatch, updatedMatch, UserAccessContext.None(), _token);

        Assert.That(result.Author, Is.EqualTo("AUTHOR"));
        Assert.That(result.Created, Is.EqualTo(new DateTime(2001, 02, 03)));
        Assert.That(result.Remover, Is.EqualTo("REMOVER"));
        Assert.That(result.Deleted, Is.EqualTo(new DateTime(2002, 03, 04)));
        Assert.That(result.Id, Is.EqualTo(currentMatch.Id));
        Assert.That(result.Version, Is.EqualTo(currentMatch.Version));
        Assert.That(result.HomeScore, Is.EqualTo(2));
        Assert.That(result.AwayScore, Is.EqualTo(3));
        Assert.That(result.HomePlayers.Select(p => p.Id), Is.EqualTo([HomePlayerDto.Id]));
        Assert.That(result.AwayPlayers.Select(p => p.Id), Is.EqualTo([AwayPlayerDto.Id]));
        Assert.That(result.Sayg, Is.Null); // the current match has no sayg
        _auditingHelper.Verify(h => h.SetUpdated(result, _token));
    }

    [Test]
    public async Task UpdateMatch_WhenNotPermitted_AdaptsToMatch()
    {
        _access = _access.Without(AccessOption.RecordScoresAsYouGo);
        var currentMatch = new GameMatch
        {
            Id = Guid.NewGuid(),
            HomeScore = 1,
            AwayScore = 2,
            Sayg = null,
            HomePlayers = { new GamePlayer { Name = "OLD HOME PLAYER" } },
            AwayPlayers = { new GamePlayer { Name = "OLD AWAY PLAYER" } },
            Created = new DateTime(2001, 02, 03),
            Author = "AUTHOR",
            Deleted = new DateTime(2002, 03, 04),
            Remover = "REMOVER",
            Version = 2,
        };
        var updatedMatch = new RecordScoresDto.RecordScoresGameMatchDto
        {
            HomePlayers = { HomePlayerDto },
            AwayPlayers = { AwayPlayerDto },
            HomeScore = 2,
            AwayScore = 3,
            Sayg = SaygDto,
        };

        var result = await _adapter.UpdateMatch(currentMatch, updatedMatch, UserAccessContext.None(), _token);

        Assert.That(result.Author, Is.EqualTo("AUTHOR"));
        Assert.That(result.Created, Is.EqualTo(new DateTime(2001, 02, 03)));
        Assert.That(result.Remover, Is.EqualTo("REMOVER"));
        Assert.That(result.Deleted, Is.EqualTo(new DateTime(2002, 03, 04)));
        Assert.That(result.Id, Is.EqualTo(currentMatch.Id));
        Assert.That(result.Version, Is.EqualTo(currentMatch.Version));
        Assert.That(result.HomeScore, Is.EqualTo(2));
        Assert.That(result.AwayScore, Is.EqualTo(3));
        Assert.That(result.HomePlayers.Select(p => p.Id), Is.EqualTo([HomePlayerDto.Id]));
        Assert.That(result.AwayPlayers.Select(p => p.Id), Is.EqualTo([AwayPlayerDto.Id]));
        Assert.That(result.Sayg, Is.Null); // the current match has no sayg
        _auditingHelper.Verify(h => h.SetUpdated(result, _token));
    }

    [Test]
    public async Task UpdateMatch_WhenPermitted_AdaptsToMatchWithSaygModel()
    {
        var currentMatch = new GameMatch
        {
            Id = Guid.NewGuid(),
            HomeScore = 1,
            AwayScore = 2,
            Sayg = null,
            HomePlayers = { new GamePlayer { Name = "OLD HOME PLAYER" } },
            AwayPlayers = { new GamePlayer { Name = "OLD AWAY PLAYER" } },
            Created = new DateTime(2001, 02, 03),
            Author = "AUTHOR",
            Deleted = new DateTime(2002, 03, 04),
            Remover = "REMOVER",
            Version = 2,
        };
        var updatedMatch = new RecordScoresDto.RecordScoresGameMatchDto
        {
            HomePlayers = { HomePlayerDto },
            AwayPlayers = { AwayPlayerDto },
            HomeScore = 2,
            AwayScore = 3,
            Sayg = SaygDto,
        };

        var result = await _adapter.UpdateMatch(currentMatch, updatedMatch, UserAccessContext.None(), _token);

        Assert.That(result.Author, Is.EqualTo("AUTHOR"));
        Assert.That(result.Created, Is.EqualTo(new DateTime(2001, 02, 03)));
        Assert.That(result.Remover, Is.EqualTo("REMOVER"));
        Assert.That(result.Deleted, Is.EqualTo(new DateTime(2002, 03, 04)));
        Assert.That(result.Id, Is.EqualTo(currentMatch.Id));
        Assert.That(result.Version, Is.EqualTo(currentMatch.Version));
        Assert.That(result.HomeScore, Is.EqualTo(2));
        Assert.That(result.AwayScore, Is.EqualTo(3));
        Assert.That(result.HomePlayers.Select(p => p.Id), Is.EqualTo([HomePlayerDto.Id]));
        Assert.That(result.AwayPlayers.Select(p => p.Id), Is.EqualTo([AwayPlayerDto.Id]));
        Assert.That(result.Sayg, Is.EqualTo(SaygModel));
        _auditingHelper.Verify(h => h.SetUpdated(result, _token));
    }

    [Test]
    public async Task UpdateMatch_GivenNoHomeOrAwayPlayers_RemovesSaygFromCurrentAndUpdatedMatch()
    {
        var currentMatch = new GameMatch
        {
            Id = Guid.NewGuid(),
            Sayg = SaygModel,
            HomePlayers = { new GamePlayer { Name = "OLD HOME PLAYER" } },
            AwayPlayers = { new GamePlayer { Name = "OLD AWAY PLAYER" } },
        };
        var updatedMatch = new RecordScoresDto.RecordScoresGameMatchDto
        {
            // players aren't set for home or away
            HomeScore = 2,
            AwayScore = 3,
            Sayg = SaygDto,
        };

        var result = await _adapter.UpdateMatch(currentMatch, updatedMatch, UserAccessContext.None(), _token);

        Assert.That(currentMatch.Sayg, Is.Null);
        Assert.That(updatedMatch.Sayg, Is.Null);
        Assert.That(result.Sayg, Is.Null);
    }
}
