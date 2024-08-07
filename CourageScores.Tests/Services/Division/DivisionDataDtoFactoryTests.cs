using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using CourageScores.Tests.Models.Cosmos.Game;
using CourageScores.Tests.Models.Dtos;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionDataDtoFactoryTests
{
    private static readonly SeasonDto Season1 = new SeasonDto
    {
        Id = Guid.NewGuid(),
        Name = "season1",
    };
    private static readonly SeasonDto Season2 = new SeasonDto
    {
        Id = Guid.NewGuid(),
        Name = "season2",
    };
    private static readonly DivisionDto Division1 = new DivisionDto
    {
        Id = Guid.NewGuid(),
        Name = "division1",
        Updated = new DateTime(2001, 02, 03),
    };
    private static readonly DivisionDto Division2 = new DivisionDto
    {
        Id = Guid.NewGuid(),
        Name = "division2",
    };
    private static readonly GamePlayer Player1 = new GamePlayer
    {
        Id = Guid.NewGuid(),
        Name = "Home player",
    };
    private static readonly GamePlayer Player2 = new GamePlayer
    {
        Id = Guid.NewGuid(),
        Name = "Away player",
    };
    private static readonly TeamDto Team1 = new TeamDtoBuilder()
        .WithName("Team 1 - Playing")
        .WithSeason(s => s.ForSeason(Season1).WithPlayers(Player1))
        .Build();
    private static readonly TeamDto Team2 = new TeamDtoBuilder()
        .WithName("Team 2 - Playing")
        .WithSeason(s => s.ForSeason(Season1).WithPlayers(Player2))
        .Build();
    private static readonly TeamDto Division1Team = new TeamDtoBuilder()
        .WithName("Team 1 - Playing")
        .WithSeason(s => s.ForSeason(Season1, Division1).WithPlayers(Player1))
        .Build();
    private static readonly TournamentGame TournamentGame = new TournamentGameBuilder()
        .WithDate(new DateTime(2001, 02, 03))
        .WithSeason(Season1)
        .WithOneEighties(new TournamentPlayer
        {
            Id = Guid.NewGuid(),
            Name = "Tournament player",
        })
        .WithType("Singles")
        .AccoladesCount()
        .Build();
    private static readonly DivisionDataContext Season1Context = new DivisionDataContextBuilder()
        .WithTeam(Team1, Team2)
        .WithSeason(Season1)
        .Build();
    private static readonly CosmosGame GameWith2AwayPlayers = new GameBuilder()
        .WithTeams(Team1, Team2)
        .WithMatch(m => m.WithScores(2, 3)
            .WithHomePlayers(Player1)
            .WithAwayPlayers(Player2, new GamePlayer { Id = Guid.NewGuid(), Name = "C" }))
        .Build();

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
        var result = await _factory.CreateDivisionDataDto(Season1Context, new[] { Division1 }, true, _token);

        Assert.That(result.Id, Is.EqualTo(Division1.Id));
        Assert.That(result.Name, Is.EqualTo(Division1.Name));
        Assert.That(result.Updated, Is.EqualTo(Division1.Updated));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenNoDivision_SetsDivisionPropertiesCorrectly()
    {
        var result = await _factory.CreateDivisionDataDto(Season1Context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Id, Is.EqualTo(Guid.Empty));
        Assert.That(result.Name, Is.EqualTo("<0 divisions>"));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenTeams_SetsTeamsCorrectly()
    {
        var team3 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team 3 - Not Playing",
        };
        var game = new GameBuilder()
            .ForDivision(Division1)
            .WithTeams(Team1, Team2)
            .WithMatch(b => b.WithScores(2, 3).WithHomePlayers(Guid.NewGuid()).WithAwayPlayers(Guid.NewGuid()))
            .Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(game)
            .WithTeam(Team1, Team2, team3)
            .WithAllTeamsInSameDivision(Division1, Team1, Team2, team3)
            .WithDivision(Division1)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.Teams.Select(t => t.Name), Is.EqualTo(new[]
        {
            "Team 2 - Playing", // more points
            "Team 1 - Playing",
            "Team 3 - Not Playing",
        }));
        Assert.That(result.Teams.Select(t => t.Division), Has.All.EqualTo(Division1));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenCrossDivisionalFixtures_SetsTeamsCorrectly()
    {
        var game = new GameBuilder()
            .ForSeason(Season1)
            .Knockout()
            .WithTeams(Division1Team, Team2)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Player1).WithAwayPlayers(Player2))
            .Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(game)
            .WithSeason(Season1)
            .WithTeam(Division1Team)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.Teams.Select(t => t.Name), Is.EqualTo(new[]
        {
            "Team 1 - Playing",
        }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenCrossDivisionalTeam_AddsDataError()
    {
        var game = new GameBuilder()
            .ForDivision(Division1)
            .ForSeason(Season1)
            .WithTeams(Team1, Team2)
            .WithMatch(m => m.WithScores(2, 3))
            .Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(game)
            .WithSeason(Season1)
            .WithTeam(Team1)
            .Build();
        WithUserAccess(importData: true);

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.DataErrors.Select(de => de.Message), Has.Member($"Potential cross-division team found: {Team2.Id}"));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenFixtures_SetsFixturesCorrectly()
    {
        var game = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Team1, Team2)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Guid.NewGuid()).WithAwayPlayers(Guid.NewGuid()))
            .Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(game)
            .WithTeam(Team1, Team2)
            .WithTournamentGame(TournamentGame)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[]
        {
            game.Date,
        }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenTournamentFixturesForDateOnly_SetsFixturesCorrectly()
    {
        var context = new DivisionDataContextBuilder()
            .WithTeam(Team1, Team2)
            .WithTournamentGame(TournamentGame)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[]
        {
            TournamentGame.Date,
        }));
        Assert.That(result.Fixtures.SelectMany(fd => fd.Fixtures), Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDivisionIdAndCrossDivisionalFixtures_CreatesFixtureDateWithInDivisionGamesOnly()
    {
        var inDivisionGame = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Team1, Team2)
            .ForDivision(Division1)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Guid.NewGuid()).WithAwayPlayers(Guid.NewGuid()))
            .Build();
        var outOfDivisionGame = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Team1, Team2)
            .ForDivision(Guid.NewGuid())
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Guid.NewGuid()).WithAwayPlayers(Guid.NewGuid()))
            .Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(inDivisionGame, outOfDivisionGame)
            .WithTeam(Team1, Team2)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

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
        var homeTeamInDivisionFixture = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Team1, Team2)
            .Build();
        var awayTeamInDivisionFixture = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Team2, Team1)
            .Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(homeTeamInDivisionFixture, awayTeamInDivisionFixture)
            .WithTeam(Team1, Team2)
            .WithTeamIdToDivisionId(Team1.Id, Division1.Id)
            .WithTeamIdToDivisionId(Team2.Id, Guid.NewGuid())
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

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
        var homeTeamInDivisionFixture = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Team1, Team2)
            .Build();
        var awayTeamInDivisionFixture = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Team2, Team1)
            .Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(homeTeamInDivisionFixture, awayTeamInDivisionFixture)
            .WithTeam(Team1, Team2)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

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
        var inDivisionGame = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Team1, Team2)
            .ForDivision(Division1)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Guid.NewGuid()).WithAwayPlayers(Guid.NewGuid()))
            .Build();
        var outOfDivisionGame = new GameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithTeams(Team1, Team2)
            .ForDivision(Guid.NewGuid())
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Guid.NewGuid()).WithAwayPlayers(Guid.NewGuid()))
            .Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(inDivisionGame, outOfDivisionGame)
            .WithTeam(Team1, Team2)
            .Build();

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
        var game = new GameBuilder()
            .ForSeason(Season1)
            .WithTeams(Team1, Team2)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Player1).WithAwayPlayers(Player2))
            .Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(game)
            .WithTeam(Team1, Team2)
            .WithSeason(Season1)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        Assert.That(result.Players.Select(f => f.Name), Is.EquivalentTo(new[]
        {
            Player1.Name, Player2.Name,
        }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenCrossDivisionalFixtures_SetsCurrentDivisionPlayersCorrectly()
    {
        var game = new GameBuilder()
            .ForSeason(Season1)
            .ForDivision(Division1)
            .WithTeams(Division1Team, Team2)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Player1).WithAwayPlayers(Player2))
            .Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(game)
            .WithTeam(Division1Team)
            .WithTournamentGame(TournamentGame)
            .WithSeason(Season1)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.Players.Select(p => p.Name), Is.EquivalentTo(new[] { Player1.Name }));
        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenTeamWithDeletedSeason_DoesNotIncludePlayers()
    {
        var thisDivisionTeam = new TeamDtoBuilder()
            .WithName("Team 1 - Playing")
            .WithSeason(s => s.ForSeason(Season1, Division1).WithPlayers(Player1).Deleted())
            .Build();
        var game = new GameBuilder()
            .ForSeason(Season1)
            .ForDivision(Division1)
            .WithTeams(thisDivisionTeam, Team2)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Player1).WithAwayPlayers(Player2))
            .Build();
        var tournament = new TournamentGameBuilder()
            .WithDate(new DateTime(2001, 02, 03))
            .WithSeason(Season1)
            .WithOneEighties(new TournamentPlayer
            {
                Id = Guid.NewGuid(),
                Name = "Tournament player",
            })
            .WithType("Singles")
            .AccoladesCount()
            .Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(game)
            .WithTeam(thisDivisionTeam)
            .WithTournamentGame(tournament)
            .WithSeason(Season1)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.Players, Is.Empty);
        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenCrossDivisionalAccolades_DoesNotReturnDataErrors()
    {
        var game = new GameBuilder(new CosmosGame { AccoladesCount = true })
            .ForSeason(Season1)
            .Knockout()
            .WithTeams(Division1Team, Team2)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Player1).WithAwayPlayers(Player2))
            .WithOneEighties(Player1, Player2)
            .Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(game)
            .WithTeam(Division1Team)
            .WithSeason(Season1)
            .Build();
        // set user as logged in, with correct access to allow errors to be returned
        WithUserAccess(importData: true);

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenNoFixtures_ReturnsNoPlayers()
    {
        var result = await _factory.CreateDivisionDataDto(Season1Context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Players, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenNoFixturesWhenAPlayerManager_ReturnsAllPlayers()
    {
        WithUserAccess(managePlayers: true);

        var result = await _factory.CreateDivisionDataDto(Season1Context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Players.Select(p => p.Name), Is.EquivalentTo(new[]
        {
            Player1.Name, Player2.Name,
        }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenFixturesWhenAPlayerManager_ReturnsAllPlayers()
    {
        var team1 = new TeamDtoBuilder()
            .WithName("Team 1 - Playing")
            .WithSeason(s => s.ForSeason(Season1).WithPlayers(Player1, new GamePlayer { Id = Guid.NewGuid(), Name = "Team 1 not playing player" }))
            .Build();
        var game = new GameBuilder()
            .ForSeason(Season1)
            .WithTeams(team1, Team2)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Player1).WithAwayPlayers(Player2))
            .Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(game)
            .WithTeam(team1, Team2)
            .WithSeason(Season1)
            .Build();
        WithUserAccess(managePlayers: true);

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Players.Select(f => f.Name), Is.EquivalentTo(new[]
        {
            Player1.Name,
            Player2.Name,
            "Team 1 not playing player",
        }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenSeason_SetsSeasonCorrectly()
    {
        var result = await _factory.CreateDivisionDataDto(Season1Context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Season!.Id, Is.EqualTo(Season1.Id));
        Assert.That(result.Season!.Name, Is.EqualTo(Season1.Name));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDataErrors_SetsDataErrorsCorrectly()
    {
        WithUserAccess(importData: true);
        var division = new DivisionDto();
        var context = new DivisionDataContextBuilder()
            .WithGame(GameWith2AwayPlayers)
            .WithTeam(Team1, Team2)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        var dataError = result.DataErrors.Single();
        Assert.That(dataError.Message, Is.EqualTo($"Mismatching number of players: Home players (1): [{Player1.Name}] vs Away players (2): [{Player2.Name}, C]"));
        Assert.That(dataError.GameId, Is.EqualTo(GameWith2AwayPlayers.Id));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDataErrorsWhenNotLoggedIn_SetsDataErrorsToEmpty()
    {
        var context = new DivisionDataContextBuilder()
            .WithGame(GameWith2AwayPlayers)
            .WithTeam(Team1, Team2)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDataErrorsWhenNotPermitted_SetsDataErrorsToEmpty()
    {
        WithUserAccess(importData: false);
        var context = new DivisionDataContextBuilder()
            .WithGame(GameWith2AwayPlayers)
            .WithTeam(Team1, Team2)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenSingleDivision_ShouldSetNameToDivision()
    {
        var result = await _factory.CreateDivisionDataDto(Season1Context, new[] { Division1 }, true, _token);

        Assert.That(result.Name, Is.EqualTo("division1"));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenMultipleDivisions_ShouldSetNameToOrderedDivisionNames()
    {
        var result = await _factory.CreateDivisionDataDto(Season1Context, new[] { Division2, Division1 }, true, _token);

        Assert.That(result.Name, Is.EqualTo("division1 & division2"));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenMultipleUnnamedDivisions_ShouldSetNameToOrderedDivisionIds()
    {
        var division1 = new DivisionDto
        {
            Id = Guid.Parse("a314b4f2-378d-4586-8b1d-eb608c9eb8bd"),
        };
        var division2 = new DivisionDto
        {
            Id = Guid.Parse("6732ee72-b72a-4497-9ef4-d779b101bbfd"),
        };

        var result = await _factory.CreateDivisionDataDto(Season1Context, new[] { division2, division1 }, true, _token);

        Assert.That(result.Name, Is.EqualTo("6732ee72-b72a-4497-9ef4-d779b101bbfd & a314b4f2-378d-4586-8b1d-eb608c9eb8bd"));
    }

    [Test]
    public async Task SeasonNotFound_GivenNoDivision_ShouldReturnCorrectly()
    {
        var result = await _factory.SeasonNotFound(Array.Empty<DivisionDto?>(), new[] { Season1, Season2 }, _token);

        Assert.That(result.Id, Is.EqualTo(Guid.Empty));
        Assert.That(result.Name, Is.EqualTo("<all divisions>"));
        Assert.That(result.Season, Is.Null);
    }

    [Test]
    public async Task SeasonNotFound_GivenDivision_ShouldReturnCorrectly()
    {
        var result = await _factory.SeasonNotFound(new[] { Division1 }, new[] { Season1, Season2 }, _token);

        Assert.That(result.Id, Is.EqualTo(Division1.Id));
        Assert.That(result.Name, Is.EqualTo("division1"));
    }

    [Test]
    public void DivisionNotFound_GivenSingleDivisionId_ReturnsDivisionIdAndName()
    {
        var result = _factory.DivisionNotFound(new[] { Division1.Id }, Array.Empty<DivisionDto>());

        Assert.That(result.Id, Is.EqualTo(Division1.Id));
        Assert.That(result.DataErrors.Select(de => de.Message), Is.EquivalentTo(new[]
        {
            $"Requested division ({Division1.Id}) was not found",
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
        var result = _factory.DivisionNotFound(new[] { Division1.Id, Division2.Id }, Array.Empty<DivisionDto>());

        Assert.That(result.Id, Is.EqualTo(Guid.Empty));
        Assert.That(result.DataErrors.Select(de => de.Message), Is.EquivalentTo(new[]
        {
            $"Requested division ({Division1.Id}) was not found, Requested division ({Division2.Id}) was not found",
        }));
    }

    private void WithUserAccess(bool importData = false, bool managePlayers = false)
    {
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ImportData = importData,
                ManagePlayers = managePlayers,
            },
        };
    }
}