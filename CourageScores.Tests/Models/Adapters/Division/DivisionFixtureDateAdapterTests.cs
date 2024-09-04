using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using CourageScores.Tests.Models.Cosmos.Game;
using CourageScores.Tests.Services;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionFixtureDateAdapterTests
{
    private static readonly TeamDto TeamA = new TeamDto
    {
        Id = Guid.NewGuid(),
        Address = "addressA",
        Name = "A",
    };
    private static readonly TeamDto TeamB = new TeamDto
    {
        Id = Guid.NewGuid(),
        Address = "addressB",
        Name = "B",
    };
    private static readonly TeamDto TeamC = new TeamDto
    {
        Id = Guid.NewGuid(),
        Address = "addressC",
        Name = "C",
    };
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
    private static readonly Dictionary<Guid, DivisionDto?> EmptyTeamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>();
    // ReSharper disable once InconsistentNaming
    private static readonly TeamDto[] TeamsAB = new[]
    {
        TeamA, TeamB,
    };
    // ReSharper disable once InconsistentNaming
    private static readonly TeamDto[] TeamsABC = new[]
    {
        TeamA,
        TeamB,
        TeamC,
    };
    // ReSharper disable once InconsistentNaming
    private static readonly Dictionary<Guid, DivisionDto?> TeamIdToDivisionLookupABC = new Dictionary<Guid, DivisionDto?>
    {
        { TeamA.Id, HomeDivision },
        { TeamB.Id, AwayDivision },
        { TeamC.Id, HomeDivision },
    };

    private readonly CancellationToken _token = new();
    private readonly DateTime _date = new(2001, 02, 03);

    private DivisionFixtureDateAdapter _adapter = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<IDivisionFixtureAdapter> _divisionFixtureAdapter = null!;
    private Mock<IDivisionTournamentFixtureDetailsAdapter> _divisionTournamentFixtureDetailsAdapter = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _user = _user.SetAccess();
        _userService = new Mock<IUserService>();
        _divisionFixtureAdapter = new Mock<IDivisionFixtureAdapter>();
        _divisionTournamentFixtureDetailsAdapter = new Mock<IDivisionTournamentFixtureDetailsAdapter>();
        _adapter = new DivisionFixtureDateAdapter(_userService.Object, _divisionFixtureAdapter.Object, _divisionTournamentFixtureDetailsAdapter.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _divisionFixtureAdapter.Setup(a => a.Adapt(LeagueFixture, TeamA, TeamB, HomeDivision, AwayDivision, _token)).ReturnsAsync(LeagueFixtureDto);
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
            Array.Empty<CosmosGame>(),
            new[]
            {
                TournamentGameA,
            },
            Array.Empty<FixtureDateNoteDto>(),
            TeamsAB,
            Array.Empty<CosmosGame>(),
            true,
            EmptyTeamIdToDivisionLookup,
            _token);

        _divisionTournamentFixtureDetailsAdapter.Verify(a => a.ForUnselectedVenue(It.IsAny<IEnumerable<TeamDto>>(), _token), Times.Never);
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[]
        {
            TournamentGameDtoA,
        }));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenNotPermittedToCreateGames_DoesNotIncludeTournamentProposals()
    {
        _user.SetAccess(manageGames: false);
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(TournamentGameA, _token))
            .ReturnsAsync(TournamentGameDtoA);

        var result = await _adapter.Adapt(
            _date,
            Array.Empty<CosmosGame>(),
            new[]
            {
                TournamentGameA,
            },
            Array.Empty<FixtureDateNoteDto>(),
            TeamsAB,
            Array.Empty<CosmosGame>(),
            true,
            EmptyTeamIdToDivisionLookup,
            _token);

        _divisionTournamentFixtureDetailsAdapter.Verify(a => a.ForUnselectedVenue(It.IsAny<IEnumerable<TeamDto>>(), _token), Times.Never);
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[]
        {
            TournamentGameDtoA,
        }));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenCanManageGames_IncludesTournamentProposals()
    {
        var tournamentGameDtoB = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressB",
        };
        _user!.Access!.ManageTournaments = true;
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(TournamentGameA, _token))
            .ReturnsAsync(TournamentGameDtoA);
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.ForUnselectedVenue(new[]
            {
                TeamB,
            }, _token))
            .ReturnsAsync(tournamentGameDtoB);

        var result = await _adapter.Adapt(
            _date,
            Array.Empty<CosmosGame>(),
            new[]
            {
                TournamentGameA,
            },
            Array.Empty<FixtureDateNoteDto>(),
            TeamsAB,
            Array.Empty<CosmosGame>(),
            true,
            EmptyTeamIdToDivisionLookup,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[]
        {
            TournamentGameDtoA, tournamentGameDtoB,
        }));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenCanManageGamesButExcludesProposals_DoesNotIncludeTournamentProposals()
    {
        _user!.Access!.ManageTournaments = true;
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(TournamentGameA, _token))
            .ReturnsAsync(TournamentGameDtoA);

        var result = await _adapter.Adapt(
            _date,
            Array.Empty<CosmosGame>(),
            new[]
            {
                TournamentGameA,
            },
            Array.Empty<FixtureDateNoteDto>(),
            TeamsAB,
            Array.Empty<CosmosGame>(),
            false,
            EmptyTeamIdToDivisionLookup,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[]
        {
            TournamentGameDtoA,
        }));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenTournamentAndLeagueFixturesExist_ReturnsBothAndNoProposals()
    {
        _user!.Access!.ManageTournaments = true;
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(TournamentGameA, _token))
            .ReturnsAsync(TournamentGameDtoA);

        var result = await _adapter.Adapt(
            _date,
            new[]
            {
                LeagueFixture,
            },
            new[]
            {
                TournamentGameA,
            },
            Array.Empty<FixtureDateNoteDto>(),
            TeamsABC,
            Array.Empty<CosmosGame>(),
            true,
            TeamIdToDivisionLookupABC,
            _token);

        _divisionFixtureAdapter.Verify(a => a.ForUnselectedTeam(It.IsAny<TeamDto>(), It.IsAny<bool>(), It.IsAny<IReadOnlyCollection<CosmosGame>>(), It.IsAny<DivisionDto?>(), _token), Times.Never);
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[]
        {
            LeagueFixtureDto,
        }));
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[]
        {
            TournamentGameDtoA,
        }));
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
        _user.SetAccess(manageGames: manageGames);
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(TeamC, false, Array.Empty<CosmosGame>(), HomeDivision, _token)).ReturnsAsync(byeDto);

        var result = await _adapter.Adapt(
            _date,
            new[]
            {
                LeagueFixture,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            TeamsABC,
            Array.Empty<CosmosGame>(),
            true,
            TeamIdToDivisionLookupABC,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[]
        {
            LeagueFixtureDto, byeDto,
        }));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task Adapt_WhenLoggedInAndNoTournamentGamesExistButExcludesProposals_OnlyReturnsExistingFixtures(bool manageGames)
    {
        _user.SetAccess(manageGames: manageGames);

        var result = await _adapter.Adapt(
            _date,
            new[]
            {
                LeagueFixture,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            TeamsABC,
            Array.Empty<CosmosGame>(),
            false,
            TeamIdToDivisionLookupABC,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[]
        {
            LeagueFixtureDto,
        }));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenLoggedInAndNoTournamentGamesExist_HighlightsByesWhereAddressInUseInAnotherDivision()
    {
        var teamA1 = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "A1",
            Address = TeamA.Address,
        };
        var teamD = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "D",
            Address = "Team D address",
        };
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
        var teams = new[]
        {
            TeamA,
            TeamB,
            teamA1,
        };
        var teamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>
        {
            { TeamA.Id, HomeDivision },
            { TeamB.Id, AwayDivision },
            { teamA1.Id, HomeDivision },
        };
        _user.SetAccess(manageGames: true);
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(teamA1, false, new[]
        {
            otherDivisionGame,
        }, HomeDivision, _token)).ReturnsAsync(byeDto);

        var result = await _adapter.Adapt(
            _date,
            new[]
            {
                LeagueFixture,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            new[]
            {
                otherDivisionGame,
            },
            true,
            teamIdToDivisionLookup,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[]
        {
            LeagueFixtureDto, byeDto,
        }));
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
            new[]
            {
                LeagueFixture,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            TeamsABC,
            Array.Empty<CosmosGame>(),
            true,
            TeamIdToDivisionLookupABC,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[]
        {
            LeagueFixtureDto, byeDto,
        }));
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
        _divisionFixtureAdapter.Setup(a => a.Adapt(game, TeamA, TeamB, HomeDivision, AwayDivision, _token)).ReturnsAsync(knockoutGameDto);
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(TeamC, true, Array.Empty<CosmosGame>(), HomeDivision, _token)).ReturnsAsync(proposedGameDto);

        var result = await _adapter.Adapt(
            _date,
            new[]
            {
                game,
            },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            TeamsABC,
            Array.Empty<CosmosGame>(),
            true,
            TeamIdToDivisionLookupABC,
            _token);

        _divisionFixtureAdapter.Verify(a => a.ForUnselectedTeam(TeamC, true, Array.Empty<CosmosGame>(), HomeDivision, _token));
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[]
        {
            knockoutGameDto, proposedGameDto,
        }));
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
        _user!.Access!.ManageTournaments = true;

        var result = await _adapter.Adapt(
            _date,
            Array.Empty<CosmosGame>(),
            Array.Empty<TournamentGame>(),
            notesForDate,
            Array.Empty<TeamDto>(),
            Array.Empty<CosmosGame>(),
            true,
            new Dictionary<Guid, DivisionDto?>(),
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Notes, Is.EqualTo(new[]
        {
            note,
        }));
    }
}