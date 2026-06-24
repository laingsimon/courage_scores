using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using CourageScores.Tests.Models.Cosmos.Game;
using CourageScores.Tests.Models.Dtos;
using CourageScores.Tests.Services;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionFixtureDateAdapterTests
{
    private static readonly TeamDto TeamA = new TeamDtoBuilder().WithAddress("addressA").WithName("A").Build();
    private static readonly TeamDto TeamB = new TeamDtoBuilder().WithAddress("addressB").WithName("B").Build();
    private static readonly TeamDto TeamC = new TeamDtoBuilder().WithAddress("addressC").WithName("C").Build();
    private static readonly DivisionDto HomeDivision = new DivisionDtoBuilder(name: "HOME DIVISION").Build();
    private static readonly DivisionDto AwayDivision = new DivisionDtoBuilder(name: "AWAY DIVISION").Build();
    private static readonly CosmosGame LeagueFixture = new GameBuilder()
        .WithTeams(TeamA, TeamB)
        .Build();
    private static readonly DivisionFixtureDto LeagueFixtureDto = new DivisionFixtureDto
    {
        Id = LeagueFixture.Id,
        HomeTeam = new DivisionFixtureTeamDto(),
    };
    private static readonly TournamentGame TournamentGameA = new TournamentGame
    {
        Address = "addressA",
    };
    private static readonly DivisionTournamentFixtureDetailsDto TournamentGameDtoA = new DivisionTournamentFixtureDetailsDto
    {
        Address = "addressA",
    };
    // ReSharper disable once CollectionNeverUpdated.Local
    private static readonly Dictionary<Guid, DivisionDto?> EmptyTeamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>();
    // ReSharper disable once InconsistentNaming
    private static readonly TeamDto[] TeamsAB = [TeamA, TeamB];
    // ReSharper disable once InconsistentNaming
    private static readonly TeamDto[] TeamsABC = [TeamA, TeamB, TeamC];
    // ReSharper disable once InconsistentNaming
    private static readonly Dictionary<Guid, DivisionDto?> TeamIdToDivisionLookupABC = new Dictionary<Guid, DivisionDto?>
    {
        { TeamA.Id, HomeDivision },
        { TeamB.Id, AwayDivision },
        { TeamC.Id, HomeDivision },
    };

    private readonly CancellationToken _token = CancellationToken.None;
    private readonly DateTime _date = new(2001, 02, 03);

    private DivisionFixtureDateAdapter _adapter = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<IDivisionFixtureAdapter> _divisionFixtureAdapter = null!;
    private Mock<IDivisionTournamentFixtureDetailsAdapter> _divisionTournamentFixtureDetailsAdapter = null!;
    private UserDto? _user;
    private SeasonDto _season = null!;
    private Mock<IAccessService> _accessService = null!;
    private HashSet<AccessOption> _access = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _season = new SeasonDto();
        _user = new UserDto();
        _userService = new Mock<IUserService>();
        _access = [];
        _accessService = new Mock<IAccessService>();
        _divisionFixtureAdapter = new Mock<IDivisionFixtureAdapter>();
        _divisionTournamentFixtureDetailsAdapter = new Mock<IDivisionTournamentFixtureDetailsAdapter>();
        _adapter = new DivisionFixtureDateAdapter(_userService.Object, _divisionFixtureAdapter.Object, _divisionTournamentFixtureDetailsAdapter.Object, _accessService.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _divisionFixtureAdapter.Setup(a => a.Adapt(LeagueFixture, _season, TeamA, TeamB, HomeDivision, AwayDivision, _token)).ReturnsAsync(LeagueFixtureDto);
        _accessService
            .Setup(s => s.HasAccess(It.IsAny<UserDto?>(), It.IsAny<AccessOption>(), _token))
            .ReturnsAsync((UserDto? _, AccessOption access, CancellationToken _) => _access.Contains(access));
    }

    [Test]
    public async Task Adapt_WhenNotLoggedIn_DoesNotIncludeTournamentProposals()
    {
        _user = null;
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(TournamentGameA, _token))
            .ReturnsAsync(TournamentGameDtoA);

        var result = await _adapter.Adapt(
            _date,
            [],
            [TournamentGameA],
            [],
            TeamsAB,
            [],
            true,
            EmptyTeamIdToDivisionLookup,
            _season,
            _token);

        _divisionTournamentFixtureDetailsAdapter.Verify(a => a.ForUnselectedVenue(It.IsAny<IEnumerable<TeamDto>>(), _token), Times.Never);
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo([TournamentGameDtoA]));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenNotPermittedToCreateGames_DoesNotIncludeTournamentProposals()
    {
        _access = _access.Without(AccessOption.ManageGames);
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(TournamentGameA, _token))
            .ReturnsAsync(TournamentGameDtoA);

        var result = await _adapter.Adapt(
            _date,
            [],
            [TournamentGameA],
            [],
            TeamsAB,
            [],
            true,
            EmptyTeamIdToDivisionLookup,
            _season,
            _token);

        _divisionTournamentFixtureDetailsAdapter.Verify(a => a.ForUnselectedVenue(It.IsAny<IEnumerable<TeamDto>>(), _token), Times.Never);
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo([TournamentGameDtoA]));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenCanManageGames_IncludesTournamentProposals()
    {
        var tournamentGameDtoB = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressB",
        };
        _access = _access.With(AccessOption.ManageTournaments);
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(TournamentGameA, _token))
            .ReturnsAsync(TournamentGameDtoA);
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.ForUnselectedVenue(new[] { TeamB }, _token))
            .ReturnsAsync(tournamentGameDtoB);

        var result = await _adapter.Adapt(
            _date,
            [],
            [TournamentGameA],
            [],
            TeamsAB,
            [],
            true,
            EmptyTeamIdToDivisionLookup,
            _season,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo([TournamentGameDtoA, tournamentGameDtoB]));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenCanManageGamesButExcludesProposals_DoesNotIncludeTournamentProposals()
    {
        _access = _access.With(AccessOption.ManageTournaments);
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(TournamentGameA, _token))
            .ReturnsAsync(TournamentGameDtoA);

        var result = await _adapter.Adapt(
            _date,
            [],
            [TournamentGameA],
            [],
            TeamsAB,
            [],
            false,
            EmptyTeamIdToDivisionLookup,
            _season,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo([TournamentGameDtoA]));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenTournamentAndLeagueFixturesExist_ReturnsBothAndNoProposals()
    {
        _access = _access.With(AccessOption.ManageTournaments);
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(TournamentGameA, _token))
            .ReturnsAsync(TournamentGameDtoA);

        var result = await _adapter.Adapt(
            _date,
            [LeagueFixture],
            [TournamentGameA],
            [],
            TeamsABC,
            [],
            true,
            TeamIdToDivisionLookupABC,
            _season,
            _token);

        _divisionFixtureAdapter.Verify(a => a.ForUnselectedTeam(It.IsAny<TeamDto>(), It.IsAny<bool>(), It.IsAny<IReadOnlyCollection<CosmosGame>>(), It.IsAny<DivisionDto?>(), _token), Times.Never);
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo([LeagueFixtureDto]));
        Assert.That(result.TournamentFixtures, Is.EqualTo([TournamentGameDtoA]));
        Assert.That(result.Notes, Is.Empty);
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task Adapt_WhenLoggedInAndNoTournamentGamesExist_IncludesByes(bool manageGames)
    {
        var byeDto = new DivisionFixtureDto
        {
            Id = Guid.NewGuid(),
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        _access = manageGames ? _access.With(AccessOption.ManageGames) : _access.Without(AccessOption.ManageGames);
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(TeamC, false, Array.Empty<CosmosGame>(), HomeDivision, _token)).ReturnsAsync(byeDto);

        var result = await _adapter.Adapt(
            _date,
            [LeagueFixture],
            [],
            [],
            TeamsABC,
            [],
            true,
            TeamIdToDivisionLookupABC,
            _season,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo([LeagueFixtureDto, byeDto]));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task Adapt_WhenLoggedInAndNoTournamentGamesExistButExcludesProposals_OnlyReturnsExistingFixtures(bool manageGames)
    {
        _access = manageGames ? _access.With(AccessOption.ManageGames) : _access.Without(AccessOption.ManageGames);

        var result = await _adapter.Adapt(
            _date,
            [LeagueFixture],
            [],
            [],
            TeamsABC,
            [],
            false,
            TeamIdToDivisionLookupABC,
            _season,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo([LeagueFixtureDto]));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenLoggedInAndNoTournamentGamesExist_HighlightsByesWhereAddressInUseInAnotherDivision()
    {
        var teamA1 = new TeamDtoBuilder().WithName("A1").WithAddress(TeamA.Address).Build();
        var teamD = new TeamDtoBuilder().WithName("D").WithAddress("Team D address").Build();
        var otherDivisionGame = new GameBuilder()
            .WithTeams(teamA1, teamD)
            .WithAddress(teamA1.Address)
            .Build();
        var byeDto = new DivisionFixtureDto
        {
            Id = Guid.NewGuid(),
            HomeTeam = new DivisionFixtureTeamDto(),
            FixturesUsingAddress = new List<OtherDivisionFixtureDto>(),
        };
        var teams = new[] { TeamA, TeamB, teamA1 };
        var teamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>
        {
            { TeamA.Id, HomeDivision },
            { TeamB.Id, AwayDivision },
            { teamA1.Id, HomeDivision },
        };
        _access = _access.With(AccessOption.ManageGames);
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(teamA1, false, new[]
        {
            otherDivisionGame,
        }, HomeDivision, _token)).ReturnsAsync(byeDto);

        var result = await _adapter.Adapt(
            _date,
            [LeagueFixture],
            [],
            [],
            teams,
            [otherDivisionGame],
            true,
            teamIdToDivisionLookup,
            _season,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo([LeagueFixtureDto, byeDto]));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenLoggedOutAndNoTournamentGamesExist_IncludesByes()
    {
        var byeDto = new DivisionFixtureDto
        {
            Id = Guid.NewGuid(),
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        _user = null;
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(TeamC, false, Array.Empty<CosmosGame>(), HomeDivision, _token)).ReturnsAsync(byeDto);

        var result = await _adapter.Adapt(
            _date,
            [LeagueFixture],
            [],
            [],
            TeamsABC,
            [],
            true,
            TeamIdToDivisionLookupABC,
            _season,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo([LeagueFixtureDto, byeDto]));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenKnockoutGamesExist_SetsHasKnockoutTrue()
    {
        var game = new GameBuilder()
            .WithTeams(TeamA, TeamB)
            .Knockout()
            .Build();
        var knockoutGameDto = new DivisionFixtureDto
        {
            Id = game.Id,
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        var proposedGameDto = new DivisionFixtureDto
        {
            Id = Guid.NewGuid(),
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        _user = null;
        _divisionFixtureAdapter.Setup(a => a.Adapt(game, _season, TeamA, TeamB, HomeDivision, AwayDivision, _token)).ReturnsAsync(knockoutGameDto);
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(TeamC, true, Array.Empty<CosmosGame>(), HomeDivision, _token)).ReturnsAsync(proposedGameDto);

        var result = await _adapter.Adapt(
            _date,
            [game],
            [],
            [],
            TeamsABC,
            [],
            true,
            TeamIdToDivisionLookupABC,
            _season,
            _token);

        _divisionFixtureAdapter.Verify(a => a.ForUnselectedTeam(TeamC, true, Array.Empty<CosmosGame>(), HomeDivision, _token));
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo([knockoutGameDto, proposedGameDto]));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_GivenNotes_AdaptsNotesForDate()
    {
        var note = new FixtureDateNoteDto();
        var notesForDate = new List<FixtureDateNoteDto>
        {
            note,
        };
        _access = _access.With(AccessOption.ManageTournaments);

        var result = await _adapter.Adapt(
            _date,
            [],
            [],
            notesForDate,
            [],
            [],
            true,
            new Dictionary<Guid, DivisionDto?>(),
            _season,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Notes, Is.EqualTo([note]));
    }
}
