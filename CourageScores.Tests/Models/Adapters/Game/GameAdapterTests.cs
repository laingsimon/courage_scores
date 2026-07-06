using AutoFixture;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CourageScores.Tests.Models.Cosmos.Game;
using CourageScores.Tests.Services;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class GameAdapterTests
{
    private static readonly GameMatch GameMatch = new();
    private static readonly GameMatch PublishedGameMatch = new()
    {
        HomeScore = 1,
        AwayScore = 2,
    };
    private static readonly GameMatchDto GameMatchDto = new();
    private static readonly GameMatchDto PublishedGameMatchDto = new()
    {
        HomeScore = 1,
        AwayScore = 2,
    };
    private static readonly GameTeam HomeTeam = new();
    private static readonly GameTeamDto HomeTeamDto = new();
    private static readonly GameTeam AwayTeam = new();
    private static readonly GameTeamDto AwayTeamDto = new();
    private static readonly GamePlayer OneEightyPlayer = new();
    private static readonly GamePlayerDto OneEightyPlayerDto = new();
    private static readonly NotablePlayer HiCheckPlayer = new();
    private static readonly GameMatchOption MatchOption = new();
    private static readonly GameMatchOptionDto MatchOptionDto = new();
    private static readonly NotablePlayerDto HiCheckPlayerDto = new();
    private static readonly PhotoReference PhotoReference = new();
    private static readonly PhotoReferenceDto PhotoReferenceDto = new();
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<IFeatureService> _featureService = null!;
    private GameAdapter _adapter = null!;
    private UserDto? _user;
    private MockAdapter<GameMatch, GameMatchDto> _matchAdapter = null!;
    private DateTimeOffset _now;
    private Queue<int> _randomValues = null!;
    private HashSet<AccessOption> _access = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _user = new UserDto();
        _featureService = fixture.FreezeMock<IFeatureService>();
        var userService = fixture.FreezeMock<IUserService>();
        var accessService = fixture.FreezeMock<IAccessService>();
        var clock = fixture.FreezeMock<TimeProvider>();
        var random = fixture.FreezeMock<Random>();
        _randomValues = new Queue<int>();
        _access = [AccessOption.ManageScores];
        _matchAdapter = new MockAdapter<GameMatch, GameMatchDto>([GameMatch, PublishedGameMatch], [GameMatchDto, PublishedGameMatchDto]);
        fixture.Register<IAdapter<GameMatch, GameMatchDto>>(() => _matchAdapter);
        fixture.Register<IAdapter<GameTeam, GameTeamDto>>(() => new MockAdapter<GameTeam, GameTeamDto>([HomeTeam, AwayTeam], [HomeTeamDto, AwayTeamDto]));
        fixture.Register<IAdapter<GamePlayer, GamePlayerDto>>(() => new MockAdapter<GamePlayer, GamePlayerDto>(OneEightyPlayer, OneEightyPlayerDto));
        fixture.Register<IAdapter<NotablePlayer, NotablePlayerDto>>(() => new MockAdapter<NotablePlayer, NotablePlayerDto>(HiCheckPlayer, HiCheckPlayerDto));
        fixture.Register<ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?>>(() => new MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?>(MatchOption, MatchOptionDto));
        fixture.Register<ISimpleAdapter<PhotoReference, PhotoReferenceDto>>(() => new MockSimpleAdapter<PhotoReference, PhotoReferenceDto>(PhotoReference, PhotoReferenceDto));
        _adapter = fixture.Create<GameAdapter>();

        userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        clock.Setup(c => c.GetUtcNow()).Returns(() => _now);
        random.Setup(r => r.Next()).Returns(() => _randomValues.Dequeue());
        accessService
            .Setup(s => s.HasAccess(_user, It.IsAny<AccessOption>(), It.IsAny<UserAccessContext>(), _token))
            .ReturnsAsync((UserDto _, AccessOption access, UserAccessContext _, CancellationToken _) => _access.Contains(access));
    }

    [Test]
    public async Task Adapt_GivenUnpublishedModel_SetPropertiesCorrectly()
    {
        var model = new GameBuilder()
            .WithAddress("address")
            .WithTeams(HomeTeam, AwayTeam)
            .WithDate(new DateTime(2001, 02, 03))
            .ForDivision(Guid.NewGuid())
            .ForSeason(Guid.NewGuid())
            .Postponed()
            .Knockout()
            .WithOneEighties(OneEightyPlayer)
            .WithOver100Checkouts(HiCheckPlayer)
            .WithPhotos(PhotoReference)
            .AccoladesCount()
            .Build();
        model.HomeSubmission = new CosmosGame();
        model.AwaySubmission = new CosmosGame();

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Address, Is.EqualTo(model.Address));
        Assert.That(result.Date, Is.EqualTo(model.Date));
        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.DivisionId, Is.EqualTo(model.DivisionId));
        Assert.That(result.SeasonId, Is.EqualTo(model.SeasonId));
        Assert.That(result.Postponed, Is.EqualTo(model.Postponed));
        Assert.That(result.IsKnockout, Is.EqualTo(model.IsKnockout));
        Assert.That(result.Home, Is.SameAs(HomeTeamDto));
        Assert.That(result.Away, Is.SameAs(AwayTeamDto));
        Assert.That(result.HomeSubmission, Is.Not.Null);
        Assert.That(result.AwaySubmission, Is.Not.Null);
        Assert.That(result.OneEighties, Is.EqualTo([OneEightyPlayerDto]));
        Assert.That(result.Over100Checkouts, Is.EqualTo([HiCheckPlayerDto]));
        Assert.That(result.AccoladesCount, Is.EqualTo(model.AccoladesCount));
        Assert.That(result.ResultsPublished, Is.False);
        Assert.That(result.Photos, Is.EquivalentTo([PhotoReferenceDto]));
    }

    [Test]
    public async Task Adapt_GivenPublishedModel_SetPropertiesCorrectly()
    {
        var model = new GameBuilder()
            .WithTeams(HomeTeam, AwayTeam)
            .WithMatch(PublishedGameMatch)
            .WithMatchOption(MatchOption)
            .Build();

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.ResultsPublished, Is.True);
        Assert.That(result.MatchOptions, Is.EquivalentTo([MatchOptionDto]));
    }

    [TestCase("true")]
    [TestCase("TRUE")]
    public async Task Adapt_GivenRandomiseSinglesConfigurationEnabledAndLoggedOut_RandomisesSingles(string configuredValue)
    {
        _featureService.Setup(f => f.Get(FeatureLookup.RandomisedSingles, _token)).ReturnsAsync(GameAdapterTestHelpers.RandomisesSinglesFeatureDto(configuredValue));
        _user = null;
        var model = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(HomeTeam, AwayTeam)
            .WithMatch(Enumerable.Range(1, 8).Select(_matchAdapter.CreateMatch).ToArray())
            .Build();
        _now = new DateTimeOffset(model.Date.AddDays(1), TimeSpan.Zero);
        var randomValues = new[] { 3, 1, 2, 5, 4 };
        _randomValues = new Queue<int>(randomValues);

        var result = await _adapter.Adapt(model, _token);

        model.AssertPairsAndTriplesInSameOrder(result);
        model.AssertSinglesInRandomOrder(result, randomValues);
    }

    [TestCase(false, false, false, true)]
    [TestCase(false, false, true, false)]
    [TestCase(false, true, false, false)]
    [TestCase(true, false, false, false)]
    public async Task Adapt_GivenRandomiseSinglesConfigurationEnabled_ConditionallyRandomisesSingles(bool canManageScores, bool canInputResultsForHome, bool canInputResultsForAway, bool randomises)
    {
        _featureService.Setup(f => f.Get(FeatureLookup.RandomisedSingles, _token)).ReturnsAsync(GameAdapterTestHelpers.RandomisesSinglesFeatureDto("true"));
        _access = canManageScores ? _access.With(AccessOption.ManageScores) : _access;
        _access = canInputResultsForHome || canInputResultsForAway ? _access.With(AccessOption.InputResults) : _access;
        SetUserTeamId(canInputResultsForHome, canInputResultsForAway);
        var model = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(HomeTeam, AwayTeam)
            .WithMatch(Enumerable.Range(1, 8).Select(_matchAdapter.CreateMatch).ToArray())
            .Build();
        var randomValues = new[] { 3, 1, 2, 5, 4 };
        _randomValues = new Queue<int>(randomValues);

        _now = new DateTimeOffset(model.Date.AddDays(1), TimeSpan.Zero);

        var result = await _adapter.Adapt(model, _token);

        model.AssertPairsAndTriplesInSameOrder(result);
        if (randomises)
        {
            model.AssertSinglesInRandomOrder(result, randomValues);
        }
        else
        {
            model.AssertSinglesInSameOrder(result);
        }
    }

    [TestCase(false, false, false)]
    [TestCase(false, false, true)]
    [TestCase(false, true, false)]
    [TestCase(true, false, false)]
    public async Task Adapt_GivenRandomiseSinglesConfigurationDisabled_NeverRandomisesSingles(bool canManageScores, bool canInputResultsForHome, bool canInputResultsForAway)
    {
        var enabled = new ConfiguredFeatureDto { ConfiguredValue = "false" };
        _featureService.Setup(f => f.Get(FeatureLookup.RandomisedSingles, _token)).ReturnsAsync(enabled);
        _access = canManageScores ? _access.With(AccessOption.ManageScores) : _access;
        _access = canInputResultsForHome || canInputResultsForAway ? _access.With(AccessOption.InputResults) : _access;
        SetUserTeamId(canInputResultsForHome, canInputResultsForAway);
        var model = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(HomeTeam, AwayTeam)
            .WithMatch(Enumerable.Range(1, 8).Select(_matchAdapter.CreateMatch).ToArray())
            .Build();
        _now = new DateTimeOffset(model.Date.AddDays(1), TimeSpan.Zero);

        var result = await _adapter.Adapt(model, _token);

        model.AssertPairsAndTriplesInSameOrder(result);
        model.AssertSinglesInSameOrder(result);
    }

    [TestCase(false, false, false)]
    [TestCase(false, false, true)]
    [TestCase(false, true, false)]
    [TestCase(true, false, false)]
    public async Task Adapt_GivenRandomiseSinglesConfigurationValueNull_NeverRandomisesSingles(bool canManageScores, bool canInputResultsForHome, bool canInputResultsForAway)
    {
        var enabled = new ConfiguredFeatureDto { ConfiguredValue = null };
        _featureService.Setup(f => f.Get(FeatureLookup.RandomisedSingles, _token)).ReturnsAsync(enabled);
        _access = canManageScores ? _access.With(AccessOption.ManageScores) : _access;
        _access = canInputResultsForHome || canInputResultsForAway ? _access.With(AccessOption.InputResults) : _access;
        SetUserTeamId(canInputResultsForHome, canInputResultsForAway);
        var model = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(HomeTeam, AwayTeam)
            .WithMatch(Enumerable.Range(1, 8).Select(_matchAdapter.CreateMatch).ToArray())
            .Build();
        _now = new DateTimeOffset(model.Date.AddDays(1), TimeSpan.Zero);

        var result = await _adapter.Adapt(model, _token);

        model.AssertPairsAndTriplesInSameOrder(result);
        model.AssertSinglesInSameOrder(result);
    }

    [TestCase(false, false, false)]
    [TestCase(false, false, true)]
    [TestCase(false, true, false)]
    [TestCase(true, false, false)]
    public async Task Adapt_GivenRandomiseSinglesNotConfigured_NeverRandomisesSingles(bool canManageScores, bool canInputResultsForHome, bool canInputResultsForAway)
    {
        _featureService.Setup(f => f.Get(FeatureLookup.RandomisedSingles, _token)).ReturnsAsync(() => null);
        _access = canManageScores ? _access.With(AccessOption.ManageScores) : _access;
        _access = canInputResultsForHome || canInputResultsForAway ? _access.With(AccessOption.InputResults) : _access;
        SetUserTeamId(canInputResultsForHome, canInputResultsForAway);
        var model = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(HomeTeam, AwayTeam)
            .WithMatch(Enumerable.Range(1, 8).Select(_matchAdapter.CreateMatch).ToArray())
            .Build();
        _now = new DateTimeOffset(model.Date.AddDays(1), TimeSpan.Zero);

        var result = await _adapter.Adapt(model, _token);

        model.AssertPairsAndTriplesInSameOrder(result);
        model.AssertSinglesInSameOrder(result);
    }

    [Test]
    public async Task Adapt_GivenVetoScoresIsConfiguredAndLoggedOut_DoesNotAdaptMatchesBeforeVeto()
    {
        _user = null;
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        _featureService.Setup(f => f.Get(FeatureLookup.VetoScores, _token)).ReturnsAsync(GameAdapterTestHelpers.VetoFeatureDto("2.00:00:00"));

        await RunVetoScoresTest(new DateTime(2001, 02, 03), false);
    }

    [Test]
    public async Task Adapt_GivenVetoScoresIsConfiguredAndNotPermitted_DoesNotAdaptMatchesBeforeVeto()
    {
        _access = _access.Without(AccessOption.ManageScores);
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        _featureService.Setup(f => f.Get(FeatureLookup.VetoScores, _token)).ReturnsAsync(GameAdapterTestHelpers.VetoFeatureDto("2.00:00:00"));

        await RunVetoScoresTest(new DateTime(2001, 02, 03), false);
    }

    [Test]
    public async Task Adapt_GivenVetoScoresIsConfiguredAndNotPermitted_AdaptMatchesAtVetoBoundaryTime()
    {
        _access = _access.Without(AccessOption.ManageScores);
        _now = new DateTimeOffset(2001, 02, 05, 04, 05, 06, TimeSpan.Zero);
        _featureService.Setup(f => f.Get(FeatureLookup.VetoScores, _token)).ReturnsAsync(GameAdapterTestHelpers.VetoFeatureDto("2.00:00:00"));

        await RunVetoScoresTest(new DateTime(2001, 02, 03), true);
    }

    [Test]
    public async Task Adapt_GivenVetoScoresIsConfiguredAndNotPermitted_AdaptMatchesAfterVeto()
    {
        _access = _access.Without(AccessOption.ManageScores);
        _now = new DateTimeOffset(2001, 02, 06, 04, 05, 06, TimeSpan.Zero);
        _featureService.Setup(f => f.Get(FeatureLookup.VetoScores, _token)).ReturnsAsync(GameAdapterTestHelpers.VetoFeatureDto("2.00:00:00"));

        await RunVetoScoresTest(new DateTime(2001, 02, 03), true);
    }

    [TestCase(false, false, false, true)]
    [TestCase(false, false, true, false)]
    [TestCase(false, true, false, false)]
    [TestCase(true, false, false, false)]
    public async Task Adapt_GivenVetoScoresIsConfigured_DoesNotAdaptMatchesBeforeVeto(bool canManageScores, bool canInputResultsForHome, bool canInputResultsForAway, bool obscuresMatches)
    {
        _access = canManageScores ? _access.With(AccessOption.ManageScores) : _access.Without(AccessOption.ManageScores);
        _access = canInputResultsForHome || canInputResultsForAway ? _access.With(AccessOption.InputResults) : _access;
        SetUserTeamId(canInputResultsForHome, canInputResultsForAway);
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        _featureService.Setup(f => f.Get(FeatureLookup.VetoScores, _token)).ReturnsAsync(GameAdapterTestHelpers.VetoFeatureDto("2.00:00:00"));

        await RunVetoScoresTest(new DateTime(2001, 02, 03), !obscuresMatches);
    }

    [TestCase(false, false, false)]
    [TestCase(false, false, true)]
    [TestCase(false, true, false)]
    [TestCase(true, false, false)]
    public async Task Adapt_GivenVetoScoresConfigurationValueNull_AlwaysAdaptsMatches(bool canManageScores, bool canInputResultsForHome, bool canInputResultsForAway)
    {
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var enabled = GameAdapterTestHelpers.VetoFeatureDto(null);
        _featureService.Setup(f => f.Get(FeatureLookup.RandomisedSingles, _token)).ReturnsAsync(enabled);
        _access = canManageScores ? _access.With(AccessOption.ManageScores) : _access;
        _access = canInputResultsForHome || canInputResultsForAway ? _access.With(AccessOption.InputResults) : _access;
        SetUserTeamId(canInputResultsForHome, canInputResultsForAway);

        await RunVetoScoresTest(new DateTime(2001, 01, 01), true);
    }

    [TestCase(false, false, false)]
    [TestCase(false, false, true)]
    [TestCase(false, true, false)]
    [TestCase(true, false, false)]
    public async Task Adapt_GivenVetoScoresNotConfigured_AlwaysAdaptsMatches(bool canManageScores, bool canInputResultsForHome, bool canInputResultsForAway)
    {
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        _featureService.Setup(f => f.Get(FeatureLookup.RandomisedSingles, _token)).ReturnsAsync(() => null);
        _access = canManageScores ? _access.With(AccessOption.ManageScores) : _access;
        _access = canInputResultsForHome || canInputResultsForAway ? _access.With(AccessOption.InputResults) : _access;
        SetUserTeamId(canInputResultsForHome, canInputResultsForAway);

        await RunVetoScoresTest(new DateTime(2001, 01, 01), true);
    }

    [Test]
    public async Task Adapt_GivenDtoWithOneEightiesAndHiCheckInRootProperties_SetPropertiesCorrectly()
    {
        var dto = new GameDto
        {
            Address = "address",
            Away = AwayTeamDto,
            Date = new DateTime(2001, 02, 03),
            Home = HomeTeamDto,
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            Postponed = true,
            IsKnockout = true,
            HomeSubmission = new GameDto { Address = "address" },
            AwaySubmission = new GameDto { Address = "address" },
            Matches = { GameMatchDto },
            OneEighties = { OneEightyPlayerDto },
            Over100Checkouts = { HiCheckPlayerDto },
            AccoladesCount = true,
            Photos = { PhotoReferenceDto },
            MatchOptions = { MatchOptionDto },
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Address, Is.EqualTo(dto.Address));
        Assert.That(result.Date, Is.EqualTo(dto.Date));
        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.DivisionId, Is.EqualTo(dto.DivisionId));
        Assert.That(result.SeasonId, Is.EqualTo(dto.SeasonId));
        Assert.That(result.Postponed, Is.EqualTo(dto.Postponed));
        Assert.That(result.IsKnockout, Is.EqualTo(dto.IsKnockout));
        Assert.That(result.Home, Is.SameAs(HomeTeam));
        Assert.That(result.Away, Is.SameAs(AwayTeam));
        Assert.That(result.Matches, Is.EqualTo([GameMatch]));
        Assert.That(result.HomeSubmission, Is.Not.Null);
        Assert.That(result.AwaySubmission, Is.Not.Null);
        Assert.That(result.OneEighties, Is.EqualTo([OneEightyPlayer]));
        Assert.That(result.Over100Checkouts, Is.EqualTo([HiCheckPlayer]));
        Assert.That(result.AccoladesCount, Is.EqualTo(dto.AccoladesCount));
        Assert.That(result.Photos, Is.EquivalentTo([PhotoReference]));
        Assert.That(result.MatchOptions, Is.EqualTo([MatchOption]));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhiteSpace()
    {
        var dto = new GameDto
        {
            Address = "address   ",
            Away = AwayTeamDto,
            Date = new DateTime(2001, 02, 03),
            Home = HomeTeamDto,
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            Postponed = true,
            IsKnockout = true,
            HomeSubmission = new GameDto { Address = "address  " },
            AwaySubmission = new GameDto { Address = "address  " },
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Address, Is.EqualTo("address"));
        Assert.That(result.HomeSubmission!.Address, Is.EqualTo("address"));
        Assert.That(result.AwaySubmission!.Address, Is.EqualTo("address"));
    }

    private async Task RunVetoScoresTest(DateTime date, bool shouldAdaptMatches)
    {
        var model = new GameBuilder()
            .WithDate(date)
            .WithTeams(HomeTeam, AwayTeam)
            .WithMatch(GameMatch)
            .Build();

        var result = await _adapter.Adapt(model, _token);

        var expected = shouldAdaptMatches
            ? new[] { GameMatchDto }
            : Array.Empty<GameMatchDto>();
        Assert.That(result.Matches, Is.EqualTo(expected));
    }

    private void SetUserTeamId(bool canInputResultsForHome, bool canInputResultsForAway)
    {
        if (canInputResultsForHome)
        {
            _user!.TeamId = HomeTeam.Id;
        }
        if (canInputResultsForAway)
        {
            _user!.TeamId = AwayTeam.Id;
        }
    }
}
