using CourageScores.Models;
using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;
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
    private readonly CancellationToken _token = new();
    private Mock<IFeatureService> _featureService = null!;
    private Mock<IUserService> _userService = null!;
    private GameAdapter _adapter = null!;
    private UserDto? _user;
    private MockAdapter<GameMatch,GameMatchDto> _matchAdapter = null!;
    private DateTimeOffset _now;
    private Mock<ISystemClock> _clock = null!;
    private Mock<Random> _random = null!;
    private Queue<int> _randomValues = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageScores = true,
            },
        };
        _featureService = new Mock<IFeatureService>();
        _userService = new Mock<IUserService>();
        _clock = new Mock<ISystemClock>();
        _random = new Mock<Random>();
        _randomValues = new Queue<int>();
        _matchAdapter = new MockAdapter<GameMatch, GameMatchDto>(new[]
        {
            GameMatch, PublishedGameMatch,
        }, new[]
        {
            GameMatchDto, PublishedGameMatchDto,
        });

        _adapter = new GameAdapter(
            _matchAdapter,
            new MockAdapter<GameTeam, GameTeamDto>(
                new[]
                {
                    HomeTeam, AwayTeam,
                },
                new[]
                {
                    HomeTeamDto, AwayTeamDto,
                }),
            new MockAdapter<GamePlayer, GamePlayerDto>(OneEightyPlayer, OneEightyPlayerDto),
            new MockAdapter<NotablePlayer, NotablePlayerDto>(HiCheckPlayer, HiCheckPlayerDto),
            new MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?>(MatchOption, MatchOptionDto),
            new MockSimpleAdapter<PhotoReference, PhotoReferenceDto>(PhotoReference, PhotoReferenceDto),
            _featureService.Object,
            _userService.Object,
            _clock.Object,
            _random.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _clock.Setup(c => c.UtcNow).Returns(() => _now);
        _random.Setup(r => r.Next()).Returns(() => _randomValues.Dequeue());
    }

    [Test]
    public async Task Adapt_GivenUnpublishedModel_SetPropertiesCorrectly()
    {
        var model = new CosmosGame
        {
            Address = "address",
            Away = AwayTeam,
            Date = new DateTime(2001, 02, 03),
            Home = HomeTeam,
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            Postponed = true,
            IsKnockout = true,
            HomeSubmission = new CosmosGame(),
            AwaySubmission = new CosmosGame(),
            OneEighties =
            {
                OneEightyPlayer,
            },
            Over100Checkouts =
            {
                HiCheckPlayer,
            },
            AccoladesCount = true,
            Photos =
            {
                PhotoReference,
            },
        };

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
        Assert.That(result.OneEighties, Is.EqualTo(new[]
        {
            OneEightyPlayerDto,
        }));
        Assert.That(result.Over100Checkouts, Is.EqualTo(new[]
        {
            HiCheckPlayerDto,
        }));
        Assert.That(result.AccoladesCount, Is.EqualTo(model.AccoladesCount));
        Assert.That(result.ResultsPublished, Is.False);
        Assert.That(result.Photos, Is.EquivalentTo(new[] { PhotoReferenceDto }));
    }

    [Test]
    public async Task Adapt_GivenPublishedModel_SetPropertiesCorrectly()
    {
        var model = new CosmosGame
        {
            Matches =
            {
                PublishedGameMatch,
            },
            MatchOptions =
            {
                MatchOption,
            }
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.ResultsPublished, Is.True);
        Assert.That(result.MatchOptions, Is.EquivalentTo(new[] { MatchOptionDto }));
    }

    [TestCase("true")]
    [TestCase("TRUE")]
    public async Task Adapt_GivenRandomiseSinglesConfigurationEnabledAndLoggedOut_RandomisesSingles(string configuredValue)
    {
        var enabled = new ConfiguredFeatureDto
        {
            ConfiguredValue = configuredValue,
        };
        _featureService.Setup(f => f.Get(FeatureLookup.RandomisedSingles, _token)).ReturnsAsync(enabled);
        _user = null;
        var model = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Away = AwayTeam,
            Home = HomeTeam,
            Matches = Enumerable.Range(1, 8).Select(CreateMatch).ToList(),
        };
        _now = new DateTimeOffset(model.Date.AddDays(1), TimeSpan.Zero);
        var randomValues = new[] { 3, 1, 2, 5, 4 };
        _randomValues = new Queue<int>(randomValues);

        var result = await _adapter.Adapt(model, _token);

        AssertPairsAndTriplesInSameOrder(model, result);
        AssertSinglesInRandomOrder(model, result, randomValues);
    }

    [TestCase(false, false, false, true)]
    [TestCase(false, false, true, false)]
    [TestCase(false, true, false, false)]
    [TestCase(true, false, false, false)]
    public async Task Adapt_GivenRandomiseSinglesConfigurationEnabled_ConditionallyRandomisesSingles(bool canManageScores, bool canInputResultsForHome, bool canInputResultsForAway, bool randomises)
    {
        var enabled = new ConfiguredFeatureDto
        {
            ConfiguredValue = "true",
        };
        _featureService.Setup(f => f.Get(FeatureLookup.RandomisedSingles, _token)).ReturnsAsync(enabled);
        _user!.Access!.ManageScores = canManageScores;
        if (canInputResultsForHome)
        {
            _user.Access.InputResults = true;
            _user.TeamId = HomeTeam.Id;
        }
        if (canInputResultsForAway)
        {
            _user.Access.InputResults = true;
            _user.TeamId = AwayTeam.Id;
        }
        var model = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Away = AwayTeam,
            Home = HomeTeam,
            Matches = Enumerable.Range(1, 8).Select(CreateMatch).ToList(),
        };
        var randomValues = new[] { 3, 1, 2, 5, 4 };
        _randomValues = new Queue<int>(randomValues);

        _now = new DateTimeOffset(model.Date.AddDays(1), TimeSpan.Zero);

        var result = await _adapter.Adapt(model, _token);

        AssertPairsAndTriplesInSameOrder(model, result);
        if (randomises)
        {
            AssertSinglesInRandomOrder(model, result, randomValues);
        }
        else
        {
            AssertSinglesInSameOrder(model, result);
        }
    }

    [TestCase(false, false, false)]
    [TestCase(false, false, true)]
    [TestCase(false, true, false)]
    [TestCase(true, false, false)]
    public async Task Adapt_GivenRandomiseSinglesConfigurationDisabled_NeverRandomisesSingles(bool canManageScores, bool canInputResultsForHome, bool canInputResultsForAway)
    {
        var enabled = new ConfiguredFeatureDto
        {
            ConfiguredValue = "false",
        };
        _featureService.Setup(f => f.Get(FeatureLookup.RandomisedSingles, _token)).ReturnsAsync(enabled);
        _user!.Access!.ManageScores = canManageScores;
        if (canInputResultsForHome)
        {
            _user.Access.InputResults = true;
            _user.TeamId = HomeTeam.Id;
        }
        if (canInputResultsForAway)
        {
            _user.Access.InputResults = true;
            _user.TeamId = AwayTeam.Id;
        }
        var model = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Away = AwayTeam,
            Home = HomeTeam,
            Matches = Enumerable.Range(1, 8).Select(CreateMatch).ToList(),
        };
        _now = new DateTimeOffset(model.Date.AddDays(1), TimeSpan.Zero);

        var result = await _adapter.Adapt(model, _token);

        AssertPairsAndTriplesInSameOrder(model, result);
        AssertSinglesInSameOrder(model, result);
    }

    [TestCase(false, false, false)]
    [TestCase(false, false, true)]
    [TestCase(false, true, false)]
    [TestCase(true, false, false)]
    public async Task Adapt_GivenRandomiseSinglesConfigurationValueNull_NeverRandomisesSingles(bool canManageScores, bool canInputResultsForHome, bool canInputResultsForAway)
    {
        var enabled = new ConfiguredFeatureDto
        {
            ConfiguredValue = null,
        };
        _featureService.Setup(f => f.Get(FeatureLookup.RandomisedSingles, _token)).ReturnsAsync(enabled);
        _user!.Access!.ManageScores = canManageScores;
        if (canInputResultsForHome)
        {
            _user.Access.InputResults = true;
            _user.TeamId = HomeTeam.Id;
        }
        if (canInputResultsForAway)
        {
            _user.Access.InputResults = true;
            _user.TeamId = AwayTeam.Id;
        }
        var model = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Away = AwayTeam,
            Home = HomeTeam,
            Matches = Enumerable.Range(1, 8).Select(CreateMatch).ToList(),
        };
        _now = new DateTimeOffset(model.Date.AddDays(1), TimeSpan.Zero);

        var result = await _adapter.Adapt(model, _token);

        AssertPairsAndTriplesInSameOrder(model, result);
        AssertSinglesInSameOrder(model, result);
    }

    [TestCase(false, false, false)]
    [TestCase(false, false, true)]
    [TestCase(false, true, false)]
    [TestCase(true, false, false)]
    public async Task Adapt_GivenRandomiseSinglesNotConfigured_NeverRandomisesSingles(bool canManageScores, bool canInputResultsForHome, bool canInputResultsForAway)
    {
        _featureService.Setup(f => f.Get(FeatureLookup.RandomisedSingles, _token)).ReturnsAsync(() => null);
        _user!.Access!.ManageScores = canManageScores;
        if (canInputResultsForHome)
        {
            _user.Access.InputResults = true;
            _user.TeamId = HomeTeam.Id;
        }
        if (canInputResultsForAway)
        {
            _user.Access.InputResults = true;
            _user.TeamId = AwayTeam.Id;
        }
        var model = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Away = AwayTeam,
            Home = HomeTeam,
            Matches = Enumerable.Range(1, 8).Select(CreateMatch).ToList(),
        };
        _now = new DateTimeOffset(model.Date.AddDays(1), TimeSpan.Zero);

        var result = await _adapter.Adapt(model, _token);

        AssertPairsAndTriplesInSameOrder(model, result);
        AssertSinglesInSameOrder(model, result);
    }

    [Test]
    public async Task Adapt_GivenVetoScoresIsConfiguredAndLoggedOut_DoesNotAdaptMatchesBeforeVeto()
    {
        _user = null;
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var enabled = new ConfiguredFeatureDto
        {
            ConfiguredValue = "2.00:00:00",
            ValueType = Feature.FeatureValueType.TimeSpan,
        };
        _featureService.Setup(f => f.Get(FeatureLookup.VetoScores, _token)).ReturnsAsync(enabled);

        await RunVetoScoresTest(new DateTime(2001, 02, 03), false);
    }

    [Test]
    public async Task Adapt_GivenVetoScoresIsConfiguredAndNotPermitted_DoesNotAdaptMatchesBeforeVeto()
    {
        _user!.Access!.ManageScores = false;
        _user!.Access!.InputResults = false;
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var enabled = new ConfiguredFeatureDto
        {
            ConfiguredValue = "2.00:00:00",
            ValueType = Feature.FeatureValueType.TimeSpan,
        };
        _featureService.Setup(f => f.Get(FeatureLookup.VetoScores, _token)).ReturnsAsync(enabled);

        await RunVetoScoresTest(new DateTime(2001, 02, 03), false);
    }

    [Test]
    public async Task Adapt_GivenVetoScoresIsConfiguredAndNotPermitted_AdaptMatchesAtVetoBoundaryTime()
    {
        _user!.Access!.ManageScores = false;
        _user!.Access!.InputResults = false;
        _now = new DateTimeOffset(2001, 02, 05, 04, 05, 06, TimeSpan.Zero);
        var enabled = new ConfiguredFeatureDto
        {
            ConfiguredValue = "2.00:00:00",
            ValueType = Feature.FeatureValueType.TimeSpan,
        };
        _featureService.Setup(f => f.Get(FeatureLookup.VetoScores, _token)).ReturnsAsync(enabled);

        await RunVetoScoresTest(new DateTime(2001, 02, 03), true);
    }

    [Test]
    public async Task Adapt_GivenVetoScoresIsConfiguredAndNotPermitted_AdaptMatchesAfterVeto()
    {
        _user!.Access!.ManageScores = false;
        _user!.Access!.InputResults = false;
        _now = new DateTimeOffset(2001, 02, 06, 04, 05, 06, TimeSpan.Zero);
        var enabled = new ConfiguredFeatureDto
        {
            ConfiguredValue = "2.00:00:00",
            ValueType = Feature.FeatureValueType.TimeSpan,
        };
        _featureService.Setup(f => f.Get(FeatureLookup.VetoScores, _token)).ReturnsAsync(enabled);

        await RunVetoScoresTest(new DateTime(2001, 02, 03), true);
    }

    [TestCase(false, false, false, true)]
    [TestCase(false, false, true, false)]
    [TestCase(false, true, false, false)]
    [TestCase(true, false, false, false)]
    public async Task Adapt_GivenVetoScoresIsConfigured_DoesNotAdaptMatchesBeforeVeto(bool canManageScores, bool canInputResultsForHome, bool canInputResultsForAway, bool obscuresMatches)
    {
        _user!.Access!.ManageScores = canManageScores;
        if (canInputResultsForHome)
        {
            _user.Access.InputResults = true;
            _user.TeamId = HomeTeam.Id;
        }
        if (canInputResultsForAway)
        {
            _user.Access.InputResults = true;
            _user.TeamId = AwayTeam.Id;
        }
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var enabled = new ConfiguredFeatureDto
        {
            ConfiguredValue = "2.00:00:00",
            ValueType = Feature.FeatureValueType.TimeSpan,
        };
        _featureService.Setup(f => f.Get(FeatureLookup.VetoScores, _token)).ReturnsAsync(enabled);

        await RunVetoScoresTest(new DateTime(2001, 02, 03), !obscuresMatches);
    }

    [TestCase(false, false, false)]
    [TestCase(false, false, true)]
    [TestCase(false, true, false)]
    [TestCase(true, false, false)]
    public async Task Adapt_GivenVetoScoresConfigurationValueNull_AlwaysAdaptsMatches(bool canManageScores, bool canInputResultsForHome, bool canInputResultsForAway)
    {
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var enabled = new ConfiguredFeatureDto
        {
            ConfiguredValue = null,
            ValueType = Feature.FeatureValueType.TimeSpan,
        };
        _featureService.Setup(f => f.Get(FeatureLookup.RandomisedSingles, _token)).ReturnsAsync(enabled);
        _user!.Access!.ManageScores = canManageScores;
        if (canInputResultsForHome)
        {
            _user.Access.InputResults = true;
            _user.TeamId = HomeTeam.Id;
        }
        if (canInputResultsForAway)
        {
            _user.Access.InputResults = true;
            _user.TeamId = AwayTeam.Id;
        }

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
        _user!.Access!.ManageScores = canManageScores;
        if (canInputResultsForHome)
        {
            _user.Access.InputResults = true;
            _user.TeamId = HomeTeam.Id;
        }
        if (canInputResultsForAway)
        {
            _user.Access.InputResults = true;
            _user.TeamId = AwayTeam.Id;
        }

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
            HomeSubmission = new GameDto
            {
                Address = "address",
            },
            AwaySubmission = new GameDto
            {
                Address = "address",
            },
            Matches =
            {
                GameMatchDto,
            },
            OneEighties =
            {
                OneEightyPlayerDto,
            },
            Over100Checkouts =
            {
                HiCheckPlayerDto,
            },
            AccoladesCount = true,
            Photos =
            {
                PhotoReferenceDto,
            },
            MatchOptions =
            {
                MatchOptionDto,
            },
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
        Assert.That(result.Matches, Is.EqualTo(new[]
        {
            GameMatch,
        }));
        Assert.That(result.HomeSubmission, Is.Not.Null);
        Assert.That(result.AwaySubmission, Is.Not.Null);
        Assert.That(result.OneEighties, Is.EqualTo(new[]
        {
            OneEightyPlayer,
        }));
        Assert.That(result.Over100Checkouts, Is.EqualTo(new[]
        {
            HiCheckPlayer,
        }));
        Assert.That(result.AccoladesCount, Is.EqualTo(dto.AccoladesCount));
        Assert.That(result.Photos, Is.EquivalentTo(new[] { PhotoReference }));
        Assert.That(result.MatchOptions, Is.EqualTo(new[]
        {
            MatchOption,
        }));
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
            HomeSubmission = new GameDto
            {
                Address = "address  ",
            },
            AwaySubmission = new GameDto
            {
                Address = "address  ",
            },
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Address, Is.EqualTo("address"));
        Assert.That(result.HomeSubmission!.Address, Is.EqualTo("address"));
        Assert.That(result.AwaySubmission!.Address, Is.EqualTo("address"));
    }

    private static void AssertPairsAndTriplesInSameOrder(CosmosGame model, GameDto result)
    {
        var resultPairsAndTriples = result.Matches.Skip(5).Select(m => m.Id).ToList();
        var modelPairsAndTriples = model.Matches.Skip(5).Select(m => m.Id).ToList();
        Assert.That(resultPairsAndTriples, Is.EqualTo(modelPairsAndTriples)); // pairs and triples should always be in the same order
    }

    private static void AssertSinglesInSameOrder(CosmosGame model, GameDto result)
    {
        var resultSingles = result.Matches.Take(5).Select(m => m.Id).ToList();
        var modelSingles = model.Matches.Take(5).Select(m => m.Id).ToList();
        Assert.That(resultSingles, Is.EqualTo(modelSingles)); // assert that all the singles are in the same order
    }

    private static void AssertSinglesInRandomOrder(CosmosGame model, GameDto result, int[] randomValues)
    {
        var resultSingles = result.Matches.Take(5).Select(m => m.Id).ToList();
        var modelSingles = model.Matches.Take(5).Select(m => m.Id).ToList();
        var expectedOrder = modelSingles.Select((match, index) => new { match, order = randomValues[index] }).ToList();
        Assert.That(resultSingles, Is.EqualTo(expectedOrder.OrderBy(a => a.order).Select(a => a.match)));
    }

    private GameMatch CreateMatch(int matchNo)
    {
        var playerCount = 1;
        if (matchNo == 6 || matchNo == 7)
        {
            playerCount = 2;
        }
        if (matchNo == 8)
        {
            playerCount = 3;
        }

        var players = Enumerable.Range(1, playerCount)
            .Select(playerNo => new GamePlayer { Name = $"Player {playerNo} of {playerCount}"})
            .ToList();

        var match = new GameMatch
        {
            Id = Guid.NewGuid(),
            HomeScore = matchNo,
            HomePlayers = players,
            AwayPlayers = players,
        };
        var matchDto = new GameMatchDto
        {
            Id = match.Id,
            HomeScore = matchNo,
        };
        _matchAdapter.AddMapping(match, matchDto);
        return match;
    }

    private async Task RunVetoScoresTest(DateTime date, bool shouldAdaptMatches)
    {
        var model = new CosmosGame
        {
            Away = AwayTeam,
            Home = HomeTeam,
            Matches =
            {
                GameMatch,
            },
            Date = date,
        };

        var result = await _adapter.Adapt(model, _token);

        if (shouldAdaptMatches)
        {
            Assert.That(result.Matches, Is.EqualTo(new[] { GameMatchDto }));
        }
        else
        {
            Assert.That(result.Matches, Is.Empty);
        }
    }
}