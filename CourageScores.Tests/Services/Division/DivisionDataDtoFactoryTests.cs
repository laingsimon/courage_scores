using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using CourageScores.Tests.Models.Cosmos.Game;
using CourageScores.Tests.Models.Dtos;
using Microsoft.AspNetCore.Authentication;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;
using Helper = CourageScores.Tests.Services.Division.DivisionDataDtoFactoryTestHelpers;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionDataDtoFactoryTests
{
    internal static readonly SeasonDto Season1 = new SeasonDtoBuilder(name: "season1").Build();
    private static readonly SeasonDto Season2 = new SeasonDtoBuilder(name: "season2").Build();
    internal static readonly DivisionDto Division1 = new DivisionDtoBuilder(name: "division1").Updated(new DateTime(2001, 02, 03)).Build();
    private static readonly DivisionDto Division2 = new DivisionDtoBuilder(name: "division2").Build();
    private static readonly GamePlayer Player1 = Helper.GamePlayer("Home player");
    private static readonly GamePlayer Player2 = Helper.GamePlayer("Away player");
    private static readonly GamePlayer NotPlaying = Helper.GamePlayer("Not playing");
    internal static readonly TeamDto Team1 = new TeamDtoBuilder()
        .WithName("Team 1 - Playing")
        .WithSeason(s => s.ForSeason(Season1).WithPlayers(Player1))
        .Build();
    internal static readonly TeamDto Team2 = new TeamDtoBuilder()
        .WithName("Team 2 - Playing")
        .WithSeason(s => s.ForSeason(Season1).WithPlayers(Player2))
        .Build();
    private static readonly TeamDto Division1Team = new TeamDtoBuilder()
        .WithName("Team 1 - Playing")
        .WithSeason(s => s.ForSeason(Season1, Division1).WithPlayers(Player1, NotPlaying))
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
    private static readonly DivisionDataContext Season1Context = Helper.DivisionDataContextBuilder().WithTeam(Team1, Team2).Build();
    private static readonly CosmosGame GameWith2AwayPlayers = new GameBuilder()
        .WithTeams(Team1, Team2)
        .WithMatch(m => m.WithScores(2, 3)
            .WithHomePlayers(Player1)
            .WithAwayPlayers(Player2, NotPlaying))
        .Build();
    private static readonly CosmosGame InDivisionGame = Helper.GameBuilder()
        .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Guid.NewGuid()).WithAwayPlayers(Guid.NewGuid()))
        .Build();
    private static readonly CosmosGame OutOfDivisionGame = Helper.GameBuilder(division: Division2)
        .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Guid.NewGuid()).WithAwayPlayers(Guid.NewGuid()))
        .Build();

    private readonly CancellationToken _token = new();
    private DivisionDataDtoFactory _factory = null!;
    private IDivisionPlayerAdapter _divisionPlayerAdapter = null!;
    private IDivisionTeamAdapter _divisionTeamAdapter = null!;
    private IDivisionDataSeasonAdapter _divisionDataSeasonAdapter = null!;
    private Mock<IDivisionFixtureDateAdapter> _divisionFixtureDateAdapter = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<ISystemClock> _clock = null!;
    private Mock<IFeatureService> _featureService = null!;
    private UserDto? _user;
    private DateTimeOffset _now;

    [SetUp]
    public void SetupEachTest()
    {
        _divisionPlayerAdapter = new DivisionPlayerAdapter(new PlayerPerformanceAdapter());
        _divisionTeamAdapter = new DivisionTeamAdapter();
        _divisionDataSeasonAdapter = new DivisionDataSeasonAdapter();
        _divisionFixtureDateAdapter = new Mock<IDivisionFixtureDateAdapter>();
        _userService = new Mock<IUserService>();
        _clock = new Mock<ISystemClock>();
        _featureService = new Mock<IFeatureService>();
        _user = null;
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        _factory = new DivisionDataDtoFactory(
            _divisionPlayerAdapter,
            _divisionTeamAdapter,
            _divisionDataSeasonAdapter,
            _divisionFixtureDateAdapter.Object,
            _userService.Object,
            _clock.Object,
            _featureService.Object);

        _clock.Setup(c => c.UtcNow).Returns(() => _now);
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

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
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
    public async Task CreateDivisionDataDto_GivenDivision_SetsSuperleagueCorrectly()
    {
        var superleagueDivision = new DivisionDtoBuilder(name: "superleague division1").Superleague().Build();

        var result = await _factory.CreateDivisionDataDto(Season1Context, new[] { superleagueDivision }, true, _token);

        Assert.That(result.Superleague, Is.True);
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
        var team3 = new TeamDtoBuilder().WithName("Team 3 - Not Playing").Build();
        var context = Helper.DivisionDataContextBuilder(game: InDivisionGame, division: Division1)
            .WithTeam(Team1, Team2, team3)
            .WithAllTeamsInSameDivision(Division1, Team1, Team2, team3)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(
            result.Teams.Select(t => t.Name),
            Is.EqualTo(new[] { "Team 2 - Playing", /* more points */ "Team 1 - Playing", "Team 3 - Not Playing" }));
        Assert.That(result.Teams.Select(t => t.Division), Has.All.EqualTo(Division1));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenCrossDivisionalFixtures_SetsTeamsCorrectly()
    {
        var game = Helper.GameBuilder()
            .Knockout()
            .WithTeams(Division1Team, Team2)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Player1).WithAwayPlayers(Player2))
            .Build();
        var context = Helper.DivisionDataContextBuilder(game: game).WithTeam(Division1Team).Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.Teams.Select(t => t.Name), Is.EqualTo(new[] { "Team 1 - Playing" }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenCrossDivisionalTeam_AddsDataError()
    {
        var game = Helper.GameBuilder().WithMatch(m => m.WithScores(2, 3)).Build();
        var context = Helper.DivisionDataContextBuilder(game: game).WithTeam(Team1).Build();
        _user = _user.SetAccess(importData: true);

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.DataErrors.Select(de => de.Message), Has.Member($"Potential cross-division team found: {Team2.Id}"));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenFixtures_SetsFixturesCorrectly()
    {
        var context = Helper.DivisionDataContextBuilder(game: InDivisionGame, tournamentGame: TournamentGame).WithTeam(Team1, Team2).Build();

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[] { InDivisionGame.Date }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenTournamentFixturesForDateOnly_SetsFixturesCorrectly()
    {
        var context = Helper.DivisionDataContextBuilder(tournamentGame: TournamentGame).WithTeam(Team1, Team2).Build();

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[] { TournamentGame.Date }));
        Assert.That(result.Fixtures.SelectMany(fd => fd.Fixtures), Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDivisionIdAndCrossDivisionalFixtures_CreatesFixtureDateWithInDivisionGamesOnly()
    {
        var context = new DivisionDataContextBuilder()
            .WithGame(InDivisionGame, OutOfDivisionGame)
            .WithTeam(Team1, Team2)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[] { InDivisionGame.Date }));
        VerifyFixtureDateAdapterCall(new DateTime(2001, 02, 03), true, new[] { InDivisionGame }, new[] { OutOfDivisionGame });
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDivisionIdAndCrossDivisionalFixtures_CreatesFixtureDateWhereEitherTeamIsInDivision()
    {
        var homeTeamInDivisionFixture = Helper.GameBuilder().Build();
        var awayTeamInDivisionFixture = Helper.GameBuilder().WithTeams(Team2, Team1).Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(homeTeamInDivisionFixture, awayTeamInDivisionFixture)
            .WithTeam(Team1, Team2)
            .WithTeamIdToDivisionId(Team1.Id, Division1.Id)
            .WithTeamIdToDivisionId(Team2.Id, Guid.NewGuid())
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[] { homeTeamInDivisionFixture.Date }));
        VerifyFixtureDateAdapterCall(new DateTime(2001, 02, 03), true, new[] { homeTeamInDivisionFixture, awayTeamInDivisionFixture });
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDivisionIdAndCrossDivisionalFixturesAndDivisionIdCannotBeFound_DoesNotIncludeFixture()
    {
        var otherDivision = new DivisionDtoBuilder().Build();
        var homeTeamInDivisionFixture = Helper.GameBuilder(division: otherDivision).Build();
        var awayTeamInDivisionFixture = Helper.GameBuilder(division: otherDivision).WithTeams(Team2, Team1).Build();
        var context = new DivisionDataContextBuilder()
            .WithGame(homeTeamInDivisionFixture, awayTeamInDivisionFixture)
            .WithTeam(Team1, Team2)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[] { homeTeamInDivisionFixture.Date }));
        VerifyFixtureDateAdapterCall(new DateTime(2001, 02, 03), true, Array.Empty<CosmosGame>());
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenNoDivisionIdAndCrossDivisionalFixtures_CreatesFixtureDateWithAllGames()
    {
        var context = new DivisionDataContextBuilder()
            .WithGame(InDivisionGame, OutOfDivisionGame)
            .WithTeam(Team1, Team2)
            .Build();

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[] { InDivisionGame.Date }));
        VerifyFixtureDateAdapterCall(new DateTime(2001, 02, 03), true, new[] { InDivisionGame, OutOfDivisionGame });
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenFixtures_SetsPlayersCorrectly()
    {
        var game = Helper.GameBuilder()
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Player1).WithAwayPlayers(Player2))
            .Build();
        var context = Helper.DivisionDataContextBuilder(game: game).WithTeam(Team1, Team2).Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.Players.Select(f => f.Name), Is.EquivalentTo(new[] { Player1.Name, Player2.Name }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenCrossDivisionalFixtures_SetsCurrentDivisionPlayersCorrectly()
    {
        var game = Helper.GameBuilder()
            .WithTeams(Division1Team, Team2)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Player1).WithAwayPlayers(Player2))
            .Build();
        var context = Helper.DivisionDataContextBuilder(game: game, tournamentGame: TournamentGame).WithTeam(Division1Team).Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.Players.Select(p => p.Name), Is.EquivalentTo(new[] { Player1.Name }));
        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenTeamWithDeletedSeason_DoesNotIncludePlayers()
    {
        var teamWithDeletedPlayer = new TeamDtoBuilder()
            .WithName("Team With Deleted Team Season")
            .WithSeason(s => s.ForSeason(Season1, Division1).Deleted().WithPlayers(Player1))
            .Build();
        var game = Helper.GameBuilder()
            .WithTeams(teamWithDeletedPlayer, Team2)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Player1).WithAwayPlayers(Player2))
            .Build();
        var context = Helper.DivisionDataContextBuilder(game: game, tournamentGame: TournamentGame).WithTeam(teamWithDeletedPlayer).Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { Division1 }, true, _token);

        Assert.That(result.Players, Is.Empty);
        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenCrossDivisionalAccolades_DoesNotReturnDataErrors()
    {
        var game = Helper.GameBuilder()
            .AccoladesCount()
            .Knockout()
            .WithTeams(Division1Team, Team2)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Player1).WithAwayPlayers(Player2))
            .WithOneEighties(Player1, Player2)
            .Build();
        var context = Helper.DivisionDataContextBuilder(game: game).WithTeam(Division1Team).Build();
        // set user as logged in, with correct access to allow errors to be returned
        _user = _user.SetAccess(importData: true);

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
        _user = _user.SetAccess(managePlayers: true);

        var result = await _factory.CreateDivisionDataDto(Season1Context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Players.Select(p => p.Name), Is.EquivalentTo(new[] { Player1.Name, Player2.Name }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenFixturesWhenAPlayerManager_ReturnsAllPlayers()
    {
        var game = Helper.GameBuilder()
            .WithTeams(Division1Team, Team2)
            .WithMatch(m => m.WithScores(2, 3).WithHomePlayers(Player1).WithAwayPlayers(Player2))
            .Build();
        var context = Helper.DivisionDataContextBuilder(game: game).WithTeam(Division1Team, Team2).Build();
        _user = _user.SetAccess(managePlayers: true);

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.Players.Select(f => f.Name), Is.EquivalentTo(new[] { Player1.Name, Player2.Name, NotPlaying.Name }));
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
        _user = _user.SetAccess(importData: true);
        var division = new DivisionDto();
        var context = Helper.DivisionDataContextBuilder(game: GameWith2AwayPlayers).WithTeam(Team1, Team2).Build();

        var result = await _factory.CreateDivisionDataDto(context, new[] { division }, true, _token);

        var dataError = result.DataErrors.Single();
        Assert.That(dataError.Message, Is.EqualTo($"Mismatching number of players: Home players (1): [{Player1.Name}] vs Away players (2): [{Player2.Name}, {NotPlaying.Name}]"));
        Assert.That(dataError.GameId, Is.EqualTo(GameWith2AwayPlayers.Id));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDataErrorsWhenNotLoggedIn_SetsDataErrorsToEmpty()
    {
        var context = Helper.DivisionDataContextBuilder(game: GameWith2AwayPlayers).WithTeam(Team1, Team2).Build();

        var result = await _factory.CreateDivisionDataDto(context, Array.Empty<DivisionDto?>(), true, _token);

        Assert.That(result.DataErrors, Is.Empty);
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDataErrorsWhenNotPermitted_SetsDataErrorsToEmpty()
    {
        _user = _user.SetAccess(importData: false);
        var context = Helper.DivisionDataContextBuilder(game: GameWith2AwayPlayers).WithTeam(Team1, Team2).Build();

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
        var division1 = new DivisionDto { Id = Guid.Parse("a314b4f2-378d-4586-8b1d-eb608c9eb8bd") };
        var division2 = new DivisionDto { Id = Guid.Parse("6732ee72-b72a-4497-9ef4-d779b101bbfd") };

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
        Assert.That(
            result.DataErrors.Select(de => de.Message),
            Is.EquivalentTo(new[] { $"Requested division ({Division1.Id}) was not found" }));
    }

    [Test]
    public void DivisionNotFound_GivenDeletedDivisionId_ReturnsDeletedDivisionMessage()
    {
        var deletedDivision = new DivisionDtoBuilder(name: "DELETED")
            .Deleted(new DateTime(2001, 02, 03, 04, 05, 06))
            .Build();

        var result = _factory.DivisionNotFound(new[] { deletedDivision.Id }, new[] { deletedDivision });

        Assert.That(result.Id, Is.EqualTo(deletedDivision.Id));
        Assert.That(
            result.DataErrors.Select(de => de.Message),
            Is.EquivalentTo(new[] { $"Requested division (DELETED / {deletedDivision.Id}) has been deleted 3 Feb 2001 04:05:06" }));
    }

    [Test]
    public void DivisionNotFound_GivenMultipleDivisionIds_ReturnsEmptyDivisionIdAndCombinedDetail()
    {
        var result = _factory.DivisionNotFound(new[] { Division1.Id, Division2.Id }, Array.Empty<DivisionDto>());

        Assert.That(result.Id, Is.EqualTo(Guid.Empty));
        Assert.That(
            result.DataErrors.Select(de => de.Message),
            Is.EquivalentTo(new[] { $"Requested division ({Division1.Id}) was not found, Requested division ({Division2.Id}) was not found" }));
    }

    private void VerifyFixtureDateAdapterCall(DateTime date, bool includeProposals, CosmosGame[] gamesForDate, CosmosGame[]? otherFixturesForDate = null)
    {
        _divisionFixtureDateAdapter.Verify(a => a.Adapt(
            date,
            It.Is<CosmosGame[]>(g => g.SequenceEqual(gamesForDate)),
            It.IsAny<TournamentGame[]>(),
            It.IsAny<FixtureDateNoteDto[]>(),
            It.IsAny<IReadOnlyCollection<TeamDto>>(),
            It.Is<CosmosGame[]>(games => otherFixturesForDate == null || games.SequenceEqual(otherFixturesForDate)),
            includeProposals,
            It.IsAny<IReadOnlyDictionary<Guid, DivisionDto?>>(),
            _token));
    }
}