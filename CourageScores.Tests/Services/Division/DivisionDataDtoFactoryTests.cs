using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionDataDtoFactoryTests
{
    private readonly CancellationToken _token = new();
    private DivisionDataDtoFactory _factory = null!;
    private IDivisionPlayerAdapter _divisionPlayerAdapter = null!;
    private IDivisionTeamAdapter _divisionTeamAdapter = null!;
    private IDivisionDataSeasonAdapter _divisionDataSeasonAdapter = null!;
    private Mock<IDivisionFixtureDateAdapter> _divisionFixtureDateAdapter = null!;
    private Mock<IUserService> _userService = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _divisionPlayerAdapter = new DivisionPlayerAdapter(new PlayerPerformanceAdapter());
        _divisionTeamAdapter = new DivisionTeamAdapter();
        _divisionDataSeasonAdapter = new DivisionDataSeasonAdapter();
        _divisionFixtureDateAdapter = new Mock<IDivisionFixtureDateAdapter>();
        _userService = new Mock<IUserService>();
        _user = null;

        _factory = new DivisionDataDtoFactory(
            _divisionPlayerAdapter,
            _divisionTeamAdapter,
            _divisionDataSeasonAdapter,
            _divisionFixtureDateAdapter.Object,
            _userService.Object);

        _divisionFixtureDateAdapter
            .Setup(a => a.Adapt(
                It.IsAny<DateTime>(),
                It.IsAny<IReadOnlyCollection<CosmosGame>>(),
                It.IsAny<IReadOnlyCollection<TournamentGame>>(),
                It.IsAny<IReadOnlyCollection<FixtureDateNoteDto>>(),
                It.IsAny<IReadOnlyCollection<TeamDto>>(),
                It.IsAny<IReadOnlyCollection<CosmosGame>>(),
                It.IsAny<bool>(),
                It.IsAny<IReadOnlyDictionary<Guid, DivisionDto?>>(),
                _token))
            .ReturnsAsync(
                (DateTime date, IReadOnlyCollection<CosmosGame> _, IReadOnlyCollection<TournamentGame> _,
                    IReadOnlyCollection<FixtureDateNoteDto> _, IReadOnlyCollection<TeamDto> _, IReadOnlyCollection<CosmosGame> _, bool _, IReadOnlyDictionary<Guid, DivisionDto?> _, CancellationToken _) => new DivisionFixtureDateDto
                {
                    Date = date,
                });

        _userService
            .Setup(s => s.GetUser(_token))
            .ReturnsAsync(() => _user);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDivision_SetsDivisionPropertiesCorrectly()
    {
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "division 1",
            Updated = new DateTime(2001, 02, 03),
        };

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        Assert.That(result.Id, Is.EqualTo(division.Id));
        Assert.That(result.Name, Is.EqualTo("division 1"));
        Assert.That(result.Updated, Is.EqualTo(division.Updated));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenNoDivision_SetsDivisionPropertiesCorrectly()
    {
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Id, Is.EqualTo(Guid.Empty));
        Assert.That(result.Name, Is.EqualTo("<0 divisions>"));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenTeams_SetsTeamsCorrectly()
    {
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "DIVISION",
        };
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
        };
        var team3 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 3 - Not Playing",
        };
        var game = new CosmosGame
        {
            DivisionId = division.Id,
            Home = new GameTeam
            {
                Id = team1.Id,
            },
            Away = new GameTeam
            {
                Id = team2.Id,
            },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                        },
                    },
                    AwayPlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                        },
                    },
                },
            },
        };
        var context = new DivisionDataContext(
            new[]
            {
                game,
            },
            new List<TeamDto>
            {
                team1,
                team2,
                team3,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            new Dictionary<Guid, Guid?>
            {
                { team1.Id, division.Id },
                { team2.Id, division.Id },
                { team3.Id, division.Id },
            },
            new Dictionary<Guid, DivisionDto>
            {
                { division.Id, division },
            });

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        Assert.That(result.Teams.Select(t => t.Name), Is.EqualTo(new[]
        {
            "Team 2 - Playing", // more points
            "Team 1 - Playing",
            "Team 3 - Not Playing",
        }));
        Assert.That(result.Teams.Select(t => t.Division), Has.All.EqualTo(division));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenCrossDivisionalFixtures_SetsTeamsCorrectly()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };
        var thisDivisionPlayer = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "This division player",
        };
        var otherDivisionPlayer = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "Other division player",
        };
        var thisDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    DivisionId = division.Id,
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = thisDivisionPlayer.Id,
                            Name = thisDivisionPlayer.Name,
                        },
                    },
                },
            },
        };
        var otherDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    DivisionId = Guid.NewGuid(),
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = otherDivisionPlayer.Id,
                            Name = otherDivisionPlayer.Name,
                        },
                    },
                },
            },
        };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            SeasonId = season.Id,
            IsKnockout = true,
            Home = new GameTeam
            {
                Id = thisDivisionTeam.Id,
            },
            Away = new GameTeam
            {
                Id = otherDivisionTeam.Id,
            },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        thisDivisionPlayer,
                    },
                    AwayPlayers =
                    {
                        otherDivisionPlayer,
                    },
                },
            },
        };
        var context = new DivisionDataContext(
            new[]
            {
                game,
            },
            new List<TeamDto>
            {
                thisDivisionTeam,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season,
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        Assert.That(result.Teams.Select(t => t.Name), Is.EqualTo(new[]
        {
            "Team 1 - Playing",
        }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenCrossDivisionalTeam_AddsDataError()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };
        var thisDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    DivisionId = division.Id,
                },
            },
        };
        var otherDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    DivisionId = Guid.NewGuid(),
                },
            },
        };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            DivisionId = division.Id,
            SeasonId = season.Id,
            Home = new GameTeam
            {
                Id = thisDivisionTeam.Id,
            },
            Away = new GameTeam
            {
                Id = otherDivisionTeam.Id,
            },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                },
            },
        };
        var context = new DivisionDataContext(
            new[]
            {
                game,
            },
            new List<TeamDto>
            {
                thisDivisionTeam,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season,
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ImportData = true,
            },
        };

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        Assert.That(result.DataErrors.Select(de => de.Message), Has.Member($"Potential cross-division team found: {otherDivisionTeam.Id}"));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenFixtures_SetsFixturesCorrectly()
    {
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
        };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = team1.Id,
            },
            Away = new GameTeam
            {
                Id = team2.Id,
            },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                        },
                    },
                    AwayPlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                        },
                    },
                },
            },
        };
        var tournamentGame = new TournamentGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            AccoladesCount = true,
        };
        var context = new DivisionDataContext(
            new[]
            {
                game,
            },
            new List<TeamDto>
            {
                team1,
                team2,
            },
            new[]
            {
                tournamentGame,
            },
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[]
        {
            game.Date,
        }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenTournamentFixturesForDateOnly_SetsFixturesCorrectly()
    {
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
        };
        var tournamentGame = new TournamentGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            AccoladesCount = true,
        };
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            new List<TeamDto>
            {
                team1,
                team2,
            },
            new[]
            {
                tournamentGame,
            },
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[]
        {
            tournamentGame.Date,
        }));
        Assert.That(result.Fixtures.SelectMany(fd => fd.Fixtures), Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDivisionIdAndCrossDivisionalFixtures_CreatesFixtureDateWithInDivisionGamesOnly()
    {
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
        };
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "Division",
        };
        var inDivisionGame = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = team1.Id,
            },
            Away = new GameTeam
            {
                Id = team2.Id,
            },
            DivisionId = division.Id,
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                        },
                    },
                    AwayPlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                        },
                    },
                },
            },
        };
        var outOfDivisionGame = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = team1.Id,
            },
            Away = new GameTeam
            {
                Id = team2.Id,
            },
            DivisionId = Guid.NewGuid(),
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                        },
                    },
                    AwayPlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                        },
                    },
                },
            },
        };
        var context = new DivisionDataContext(
            new[]
            {
                inDivisionGame, outOfDivisionGame,
            },
            new List<TeamDto>
            {
                team1,
                team2,
            },
            new List<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[]
        {
            inDivisionGame.Date,
        }));
        _divisionFixtureDateAdapter.Verify(a => a.Adapt(
            new DateTime(2001, 02, 03),
            It.Is<CosmosGame[]>(games => games.SequenceEqual(new[]
            {
                inDivisionGame,
            })),
            It.IsAny<TournamentGame[]>(),
            It.IsAny<FixtureDateNoteDto[]>(),
            It.IsAny<IReadOnlyCollection<TeamDto>>(),
            It.Is<CosmosGame[]>(games => games.SequenceEqual(new[]
            {
                outOfDivisionGame,
            })),
            true,
            It.IsAny<IReadOnlyDictionary<Guid, DivisionDto?>>(),
            _token));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDivisionIdAndCrossDivisionalFixtures_CreatesFixtureDateWhereEitherTeamIsInDivision()
    {
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
        };
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "Division",
        };
        var homeTeamInDivisionFixture = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = team1.Id,
            },
            Away = new GameTeam
            {
                Id = team2.Id,
            },
        };
        var awayTeamInDivisionFixture = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = team2.Id,
            },
            Away = new GameTeam
            {
                Id = team1.Id,
            },
        };
        var context = new DivisionDataContext(
            new[]
            {
                homeTeamInDivisionFixture, awayTeamInDivisionFixture,
            },
            new List<TeamDto>
            {
                team1,
                team2,
            },
            new List<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            new Dictionary<Guid, Guid?>
            {
                { team1.Id, division.Id },
                { team2.Id, Guid.NewGuid() },
            },
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[]
        {
            homeTeamInDivisionFixture.Date,
        }));
        _divisionFixtureDateAdapter.Verify(a => a.Adapt(
            new DateTime(2001, 02, 03),
            It.Is<CosmosGame[]>(games => games.SequenceEqual(new[]
            {
                homeTeamInDivisionFixture,
                awayTeamInDivisionFixture,
            })),
            It.IsAny<TournamentGame[]>(),
            It.IsAny<FixtureDateNoteDto[]>(),
            It.IsAny<IReadOnlyCollection<TeamDto>>(),
            It.IsAny<CosmosGame[]>(),
            true,
            It.IsAny<IReadOnlyDictionary<Guid, DivisionDto?>>(),
            _token));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDivisionIdAndCrossDivisionalFixturesAndDivisionIdCannotBeFound_DoesNotIncludeFixture()
    {
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
        };
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "Division",
        };
        var homeTeamInDivisionFixture = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = team1.Id,
            },
            Away = new GameTeam
            {
                Id = team2.Id,
            },
        };
        var awayTeamInDivisionFixture = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = team2.Id,
            },
            Away = new GameTeam
            {
                Id = team1.Id,
            },
        };
        var context = new DivisionDataContext(
            new[]
            {
                homeTeamInDivisionFixture, awayTeamInDivisionFixture,
            },
            new List<TeamDto>
            {
                team1,
                team2,
            },
            new List<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[]
        {
            homeTeamInDivisionFixture.Date,
        }));
        _divisionFixtureDateAdapter.Verify(a => a.Adapt(
            new DateTime(2001, 02, 03),
            It.Is<CosmosGame[]>(games => !games.Any()),
            It.IsAny<TournamentGame[]>(),
            It.IsAny<FixtureDateNoteDto[]>(),
            It.IsAny<IReadOnlyCollection<TeamDto>>(),
            It.IsAny<CosmosGame[]>(),
            true,
            It.IsAny<IReadOnlyDictionary<Guid, DivisionDto?>>(),
            _token));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenNoDivisionIdAndCrossDivisionalFixtures_CreatesFixtureDateWithAllGames()
    {
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
        };
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "Division",
        };
        var inDivisionGame = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = team1.Id,
            },
            Away = new GameTeam
            {
                Id = team2.Id,
            },
            DivisionId = division.Id,
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                        },
                    },
                    AwayPlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                        },
                    },
                },
            },
        };
        var outOfDivisionGame = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = team1.Id,
            },
            Away = new GameTeam
            {
                Id = team2.Id,
            },
            DivisionId = Guid.NewGuid(),
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                        },
                    },
                    AwayPlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                        },
                    },
                },
            },
        };
        var context = new DivisionDataContext(
            new[]
            {
                inDivisionGame, outOfDivisionGame,
            },
            new List<TeamDto>
            {
                team1,
                team2,
            },
            new List<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[]
        {
            inDivisionGame.Date,
        }));
        _divisionFixtureDateAdapter.Verify(a => a.Adapt(
            new DateTime(2001, 02, 03),
            It.Is<CosmosGame[]>(games => games.SequenceEqual(new[]
            {
                inDivisionGame, outOfDivisionGame,
            })),
            It.IsAny<TournamentGame[]>(),
            It.IsAny<FixtureDateNoteDto[]>(),
            It.IsAny<IReadOnlyCollection<TeamDto>>(),
            It.Is<CosmosGame[]>(games => games.Length == 0),
            true,
            It.IsAny<IReadOnlyDictionary<Guid, DivisionDto?>>(),
            _token));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenFixtures_SetsPlayersCorrectly()
    {
        var division = new DivisionDto();
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var player1 = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "Home player",
        };
        var player2 = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "Away player",
        };
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = player1.Id,
                            Name = player1.Name,
                        },
                    },
                },
            },
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = player2.Id,
                            Name = player2.Name,
                        },
                    },
                },
            },
        };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            SeasonId = season.Id,
            Home = new GameTeam
            {
                Id = team1.Id,
            },
            Away = new GameTeam
            {
                Id = team2.Id,
            },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        player1,
                    },
                    AwayPlayers =
                    {
                        player2,
                    },
                },
            },
        };
        var context = new DivisionDataContext(
            new[]
            {
                game,
            },
            new List<TeamDto>
            {
                team1,
                team2,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season,
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        Assert.That(result.Players.Select(f => f.Name), Is.EquivalentTo(new[]
        {
            player1.Name, player2.Name,
        }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenCrossDivisionalFixtures_SetsCurrentDivisionPlayersCorrectly()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };
        var thisDivisionPlayer = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "This division player",
        };
        var otherDivisionPlayer = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "Other division player",
        };
        var thisDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    DivisionId = division.Id,
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = thisDivisionPlayer.Id,
                            Name = thisDivisionPlayer.Name,
                        },
                    },
                },
            },
        };
        var otherDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    DivisionId = Guid.NewGuid(),
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = otherDivisionPlayer.Id,
                            Name = otherDivisionPlayer.Name,
                        },
                    },
                },
            },
        };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            SeasonId = season.Id,
            DivisionId = division.Id,
            IsKnockout = false,
            Home = new GameTeam
            {
                Id = thisDivisionTeam.Id,
            },
            Away = new GameTeam
            {
                Id = otherDivisionTeam.Id,
            },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        thisDivisionPlayer,
                    },
                    AwayPlayers =
                    {
                        otherDivisionPlayer,
                    },
                },
            },
        };
        var tournament = new TournamentGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            SeasonId = season.Id,
            OneEighties =
            {
                new TournamentPlayer
                {
                    Id = Guid.NewGuid(),
                    Name = "Tournament player",
                },
            },
            Type = "Singles",
            AccoladesCount = true,
        };
        var context = new DivisionDataContext(
            new[]
            {
                game,
            },
            new List<TeamDto>
            {
                thisDivisionTeam,
            },
            new[]
            {
                tournament,
            },
            Array.Empty<FixtureDateNoteDto>(),
            season,
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        Assert.That(result.Players.Select(p => p.Name), Is.EquivalentTo(new[] { thisDivisionPlayer.Name }));
        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenTeamWithDeletedSeason_DoesNotIncludePlayers()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };
        var thisDivisionPlayer = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "This division player",
        };
        var otherDivisionPlayer = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "Other division player",
        };
        var thisDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    DivisionId = division.Id,
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = thisDivisionPlayer.Id,
                            Name = thisDivisionPlayer.Name,
                        },
                    },
                    Deleted = DateTime.UtcNow,
                },
            },
        };
        var otherDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    DivisionId = Guid.NewGuid(),
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = otherDivisionPlayer.Id,
                            Name = otherDivisionPlayer.Name,
                        },
                    },
                },
            },
        };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            SeasonId = season.Id,
            DivisionId = division.Id,
            IsKnockout = false,
            Home = new GameTeam
            {
                Id = thisDivisionTeam.Id,
            },
            Away = new GameTeam
            {
                Id = otherDivisionTeam.Id,
            },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        thisDivisionPlayer,
                    },
                    AwayPlayers =
                    {
                        otherDivisionPlayer,
                    },
                },
            },
        };
        var tournament = new TournamentGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            SeasonId = season.Id,
            OneEighties =
            {
                new TournamentPlayer
                {
                    Id = Guid.NewGuid(),
                    Name = "Tournament player",
                },
            },
            Type = "Singles",
            AccoladesCount = true,
        };
        var context = new DivisionDataContext(
            new[]
            {
                game,
            },
            new List<TeamDto>
            {
                thisDivisionTeam,
            },
            new[]
            {
                tournament,
            },
            Array.Empty<FixtureDateNoteDto>(),
            season,
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        Assert.That(result.Players, Is.Empty);
        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenCrossDivisionalAccolades_DoesNotReturnDataErrors()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "Division 1",
        };
        var thisDivisionPlayer = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "This division player",
        };
        var otherDivisionPlayer = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "Other division player",
        };
        var thisDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    DivisionId = division.Id,
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = thisDivisionPlayer.Id,
                            Name = thisDivisionPlayer.Name,
                        },
                    },
                },
            },
        };
        var otherDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    DivisionId = Guid.NewGuid(),
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = otherDivisionPlayer.Id,
                            Name = otherDivisionPlayer.Name,
                        },
                    },
                },
            },
        };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            SeasonId = season.Id,
            IsKnockout = true,
            AccoladesCount = true,
            Home = new GameTeam
            {
                Id = thisDivisionTeam.Id,
            },
            Away = new GameTeam
            {
                Id = otherDivisionTeam.Id,
            },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        thisDivisionPlayer,
                    },
                    AwayPlayers =
                    {
                        otherDivisionPlayer,
                    },
                },
            },
            OneEighties =
            {
                thisDivisionPlayer,
                otherDivisionPlayer,
            },
        };
        var context = new DivisionDataContext(
            new[]
            {
                game,
            },
            new List<TeamDto>
            {
                thisDivisionTeam,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season,
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());
        // set user as logged in, with correct access to allow errors to be returned
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ImportData = true,
            },
        };

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenNoFixtures_ReturnsNoPlayers()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Team 1 player",
                        },
                    },
                },
            },
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Team 2 player",
                        },
                    },
                },
            },
        };
        var context = new DivisionDataContext(
            new List<CosmosGame>(),
            new List<TeamDto>
            {
                team1,
                team2,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season,
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Players, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenNoFixturesWhenAPlayerManager_ReturnsAllPlayers()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Team 1 player",
                        },
                    },
                },
            },
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Team 2 player",
                        },
                    },
                },
            },
        };
        var context = new DivisionDataContext(
            new List<CosmosGame>(),
            new List<TeamDto>
            {
                team1,
                team2,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season,
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManagePlayers = true,
            },
        };

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Players.Select(p => p.Name), Is.EquivalentTo(new[]
        {
            "Team 1 player", "Team 2 player",
        }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenFixturesWhenAPlayerManager_ReturnsAllPlayers()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
        var player1 = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "Home player",
        };
        var player2 = new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = "Away player",
        };
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = player1.Id,
                            Name = player1.Name,
                        },
                        new TeamPlayerDto
                        {
                            Id = Guid.NewGuid(),
                            Name = "Team 1 not playing player",
                        },
                    },
                },
            },
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = season.Id,
                    Players =
                    {
                        new TeamPlayerDto
                        {
                            Id = player2.Id,
                            Name = player2.Name,
                        },
                    },
                },
            },
        };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            SeasonId = season.Id,
            Home = new GameTeam
            {
                Id = team1.Id,
            },
            Away = new GameTeam
            {
                Id = team2.Id,
            },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        player1,
                    },
                    AwayPlayers =
                    {
                        player2,
                    },
                },
            },
        };
        var context = new DivisionDataContext(
            new[]
            {
                game,
            },
            new List<TeamDto>
            {
                team1,
                team2,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season,
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManagePlayers = true,
            },
        };

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Players.Select(f => f.Name), Is.EquivalentTo(new[]
        {
            player1.Name,
            player2.Name,
            "Team 1 not playing player",
        }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenSeason_SetsSeasonCorrectly()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Name = "season",
        };
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season,
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Season!.Id, Is.EqualTo(season.Id));
        Assert.That(result.Season!.Name, Is.EqualTo(season.Name));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDataErrors_SetsDataErrorsCorrectly()
    {
        var division = new DivisionDto();
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ImportData = true,
            },
        };
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
        };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = team1.Id,
            },
            Away = new GameTeam
            {
                Id = team2.Id,
            },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                            Name = "A",
                        },
                    },
                    AwayPlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                            Name = "B",
                        },
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                            Name = "C",
                        },
                    },
                },
            },
        };
        var context = new DivisionDataContext(
            new[]
            {
                game,
            },
            new List<TeamDto>
            {
                team1,
                team2,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        var dataError = result.DataErrors.Single();
        Assert.That(dataError.Message, Is.EqualTo("Mismatching number of players: Home players (1): [A] vs Away players (2): [B, C]"));
        Assert.That(dataError.GameId, Is.EqualTo(game.Id));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDataErrorsWhenNotLoggedIn_SetsDataErrorsToEmpty()
    {
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
        };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = team1.Id,
            },
            Away = new GameTeam
            {
                Id = team2.Id,
            },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                            Name = "A",
                        },
                    },
                    AwayPlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                            Name = "B",
                        },
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                            Name = "C",
                        },
                    },
                },
            },
        };
        var context = new DivisionDataContext(
            new[]
            {
                game,
            },
            new List<TeamDto>
            {
                team1,
                team2,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDataErrorsWhenNotPermitted_SetsDataErrorsToEmpty()
    {
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ImportData = false,
            },
        };
        var team1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 1 - Playing",
        };
        var team2 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 2 - Playing",
        };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = team1.Id,
            },
            Away = new GameTeam
            {
                Id = team2.Id,
            },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                            Name = "A",
                        },
                    },
                    AwayPlayers =
                    {
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                            Name = "B",
                        },
                        new GamePlayer
                        {
                            Id = Guid.NewGuid(),
                            Name = "C",
                        },
                    },
                },
            },
        };
        var context = new DivisionDataContext(
            new[]
            {
                game,
            },
            new List<TeamDto>
            {
                team1,
                team2,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenSingleDivision_ShouldSetNameToDivision()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Name = "season",
        };
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season,
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "DIVISION",
        };

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        Assert.That(result.Name, Is.EqualTo("DIVISION"));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenMultipleDivisions_ShouldSetNameToOrderedDivisionNames()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Name = "season",
        };
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season,
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());
        var division1 = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "DIVISION ONE",
        };
        var division2 = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "DIVISION TWO",
        };

        var result = await _factory.CreateDivisionDataDto(context, new[] { division2, division1 }, true, _token);

        Assert.That(result.Name, Is.EqualTo("DIVISION ONE & DIVISION TWO"));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenMultipleUnnamedDivisions_ShouldSetNameToOrderedDivisionIds()
    {
        var season = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Name = "season",
        };
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season,
            new Dictionary<Guid, Guid?>(),
            new Dictionary<Guid, DivisionDto>());
        var division1 = new DivisionDto
        {
            Id = Guid.Parse("a314b4f2-378d-4586-8b1d-eb608c9eb8bd"),
        };
        var division2 = new DivisionDto
        {
            Id = Guid.Parse("6732ee72-b72a-4497-9ef4-d779b101bbfd"),
        };

        var result = await _factory.CreateDivisionDataDto(context, new[] { division2, division1 }, true, _token);

        Assert.That(result.Name, Is.EqualTo("6732ee72-b72a-4497-9ef4-d779b101bbfd & a314b4f2-378d-4586-8b1d-eb608c9eb8bd"));
    }

    [Test]
    public async Task SeasonNotFound_GivenNoDivision_ShouldReturnCorrectly()
    {
        var season1 = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Name = "season1",
        };
        var season2 = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Name = "season2",
        };
        var seasons = new[]
        {
            season1, season2,
        };

        var result = await _factory.SeasonNotFound(Array.Empty<DivisionDto?>(), seasons, _token);

        Assert.That(result.Id, Is.EqualTo(Guid.Empty));
        Assert.That(result.Name, Is.EqualTo("<all divisions>"));
        Assert.That(result.Season, Is.Null);
    }

    [Test]
    public async Task SeasonNotFound_GivenDivision_ShouldReturnCorrectly()
    {
        var season1 = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Name = "season1",
        };
        var season2 = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Name = "season2",
        };
        var seasons = new[]
        {
            season1, season2,
        };
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "division1",
        };

        var result = await _factory.SeasonNotFound(new[] { division }, seasons, _token);

        Assert.That(result.Id, Is.EqualTo(division.Id));
        Assert.That(result.Name, Is.EqualTo("division1"));
    }

    [Test]
    public void DivisionNotFound_GivenSingleDivisionId_ReturnsDivisionIdAndName()
    {
        var divisionId = Guid.NewGuid();

        var result = _factory.DivisionNotFound(new[] { divisionId }, Array.Empty<DivisionDto>());

        Assert.That(result.Id, Is.EqualTo(divisionId));
        Assert.That(result.DataErrors.Select(de => de.Message), Is.EquivalentTo(new[]
        {
            $"Requested division ({divisionId}) was not found",
        }));
    }

    [Test]
    public void DivisionNotFound_GivenDeletedDivisionId_ReturnsDeletedDivisionMessage()
    {
        var deletedDivision = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "DELETED",
            Deleted = new DateTime(2001, 02, 03, 04, 05, 06),
        };

        var result = _factory.DivisionNotFound(new[] { deletedDivision.Id }, new[] { deletedDivision });

        Assert.That(result.Id, Is.EqualTo(deletedDivision.Id));
        Assert.That(result.DataErrors.Select(de => de.Message), Is.EquivalentTo(new[]
        {
            $"Requested division (DELETED / {deletedDivision.Id}) has been deleted 3 Feb 2001 04:05:06",
        }));
    }

    [Test]
    public void DivisionNotFound_GivenMultipleDivisionIds_ReturnsEmptyDivisionIdAndCombinedDetail()
    {
        var divisionId1 = Guid.NewGuid();
        var divisionId2 = Guid.NewGuid();

        var result = _factory.DivisionNotFound(new[] { divisionId1, divisionId2 }, Array.Empty<DivisionDto>());

        Assert.That(result.Id, Is.EqualTo(Guid.Empty));
        Assert.That(result.DataErrors.Select(de => de.Message), Is.EquivalentTo(new[]
        {
            $"Requested division ({divisionId1}) was not found, Requested division ({divisionId2}) was not found",
        }));
    }
}