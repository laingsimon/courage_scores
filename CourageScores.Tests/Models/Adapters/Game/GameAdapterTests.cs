using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Identity;
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
            _userService.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
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

        await RunRandomiseSinglesTest(true);
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

        await RunRandomiseSinglesTest(randomises);
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

        await RunRandomiseSinglesTest(false);
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

        await RunRandomiseSinglesTest(false);
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

        await RunRandomiseSinglesTest(false);
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

    private async Task RunRandomiseSinglesTest(bool randomiseOrderOfSingles)
    {
        var model = new CosmosGame
        {
            Away = AwayTeam,
            Home = HomeTeam,
            Matches = Enumerable.Range(1, 8).Select(CreateMatch).ToList(),
        };

        for (var iteration = 1; iteration <= 10; iteration++)
        {
            try
            {
                // repeat the test a number of times, so that a randomisation of singles resulting
                // in the same order of matches is ignored
                await RandomiseSinglesTestIteration(model, randomiseOrderOfSingles);
                return; // test passed
            }
            catch (AssertionException)
            {
                if (iteration >= 10)
                {
                    throw;
                }
            }
        }

        // should never reach here...
        Assert.Fail("Issue with test execution; test should have passed or thrown the (assertion) exception");
    }

    private async Task RandomiseSinglesTestIteration(CosmosGame model, bool randomiseOrderOfSingles)
    {
        var result = await _adapter.Adapt(model, _token);

        var resultSingles = result.Matches.Take(5).Select(m => m.Id).ToList();
        var modelSingles = model.Matches.Take(5).Select(m => m.Id).ToList();
        var resultPairsAndTriples = result.Matches.Skip(5).Select(m => m.Id).ToList();
        var modelPairsAndTriples = model.Matches.Skip(5).Select(m => m.Id).ToList();
        Assert.That(resultPairsAndTriples, Is.EqualTo(modelPairsAndTriples)); // pairs and triples should always be in the same order
        if (randomiseOrderOfSingles)
        {
            Assert.That(resultSingles, Is.EquivalentTo(modelSingles)); // all singles should be present in the first 5 matches, regardless of order
            Assert.That(resultSingles, Is.Not.EqualTo(modelSingles), () => "Singles should be in a random order, different to the original order"); // assert that singles aren't in the original order
        }
        else
        {
            Assert.That(resultSingles, Is.EqualTo(modelSingles)); // assert that all the singles are in the same order
        }
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
}