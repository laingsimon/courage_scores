using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionFixtureDateAdapterTests
{
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
        _user = new UserDto
        {
            Access = new AccessDto(),
        };
        _userService = new Mock<IUserService>();
        _divisionFixtureAdapter = new Mock<IDivisionFixtureAdapter>();
        _divisionTournamentFixtureDetailsAdapter = new Mock<IDivisionTournamentFixtureDetailsAdapter>();
        _adapter = new DivisionFixtureDateAdapter(_userService.Object, _divisionFixtureAdapter.Object, _divisionTournamentFixtureDetailsAdapter.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
    }

    [Test]
    public async Task Adapt_WhenNotLoggedIn_DoesNotIncludeTournamentProposals()
    {
        var gamesForDate = Array.Empty<CosmosGame>();
        var tournamentGameDtoA = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressA",
        };
        var teamA = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "addressA",
            Name = "A",
        };
        var teamB = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "addressB",
            Name = "B",
        };
        var tournamentGameA = new TournamentGame
        {
            Address = "addressA",
        };
        var teams = new[]
        {
            teamA, teamB,
        };
        var teamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>();
        _user = null;
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(tournamentGameA, _token))
            .ReturnsAsync(tournamentGameDtoA);

        var result = await _adapter.Adapt(
            _date,
            gamesForDate,
            new[]
            {
                tournamentGameA,
            },
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CosmosGame>(),
            true,
            teamIdToDivisionLookup,
            _token);

        _divisionTournamentFixtureDetailsAdapter.Verify(a => a.ForUnselectedVenue(It.IsAny<IEnumerable<TeamDto>>(), _token), Times.Never);
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[]
        {
            tournamentGameDtoA,
        }));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenNotPermittedToCreateGames_DoesNotIncludeTournamentProposals()
    {
        var gamesForDate = Array.Empty<CosmosGame>();
        var tournamentGameDtoA = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressA",
        };
        var teamA = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "addressA",
            Name = "A",
        };
        var teamB = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "addressB",
            Name = "B",
        };
        var tournamentGameA = new TournamentGame
        {
            Address = "addressA",
        };
        var teams = new[]
        {
            teamA, teamB,
        };
        var teamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>();
        _user!.Access!.ManageGames = false;
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(tournamentGameA, _token))
            .ReturnsAsync(tournamentGameDtoA);

        var result = await _adapter.Adapt(
            _date,
            gamesForDate,
            new[]
            {
                tournamentGameA,
            },
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CosmosGame>(),
            true,
            teamIdToDivisionLookup,
            _token);

        _divisionTournamentFixtureDetailsAdapter.Verify(a => a.ForUnselectedVenue(It.IsAny<IEnumerable<TeamDto>>(), _token), Times.Never);
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[]
        {
            tournamentGameDtoA,
        }));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenCanManageGames_IncludesTournamentProposals()
    {
        var gamesForDate = Array.Empty<CosmosGame>();
        var tournamentGameDtoA = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressA",
        };
        var tournamentGameDtoB = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressB",
        };
        var teamA = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "addressA",
            Name = "A",
        };
        var teamB = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "addressB",
            Name = "B",
        };
        var tournamentGameA = new TournamentGame
        {
            Address = "addressA",
        };
        var teams = new[]
        {
            teamA, teamB,
        };
        var teamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>();
        _user!.Access!.ManageTournaments = true;
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(tournamentGameA, _token))
            .ReturnsAsync(tournamentGameDtoA);
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.ForUnselectedVenue(new[]
            {
                teamB,
            }, _token))
            .ReturnsAsync(tournamentGameDtoB);

        var result = await _adapter.Adapt(
            _date,
            gamesForDate,
            new[]
            {
                tournamentGameA,
            },
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CosmosGame>(),
            true,
            teamIdToDivisionLookup,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[]
        {
            tournamentGameDtoA, tournamentGameDtoB,
        }));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenCanManageGamesButExcludesProposals_DoesNotIncludeTournamentProposals()
    {
        var gamesForDate = Array.Empty<CosmosGame>();
        var tournamentGameDtoA = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressA",
        };
        var teamA = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "addressA",
            Name = "A",
        };
        var teamB = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "addressB",
            Name = "B",
        };
        var tournamentGameA = new TournamentGame
        {
            Address = "addressA",
        };
        var teams = new[]
        {
            teamA, teamB,
        };
        var teamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>();
        _user!.Access!.ManageTournaments = true;
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(tournamentGameA, _token))
            .ReturnsAsync(tournamentGameDtoA);

        var result = await _adapter.Adapt(
            _date,
            gamesForDate,
            new[]
            {
                tournamentGameA,
            },
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CosmosGame>(),
            false,
            teamIdToDivisionLookup,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[]
        {
            tournamentGameDtoA,
        }));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenTournamentAndLeagueFixturesExist_ReturnsBothAndNoProposals()
    {
        var homeDivision = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME DIVISION",
        };
        var awayDivision = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY DIVISION",
        };
        var teamA = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "addressA",
            Name = "A",
        };
        var teamB = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "addressB",
            Name = "B",
        };
        var teamC = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "addressC",
            Name = "C",
        };
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = teamA.Id,
            },
            Away = new GameTeam
            {
                Id = teamB.Id,
            },
        };
        var gameDto = new DivisionFixtureDto
        {
            Id = game.Id,
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        var tournamentGameA = new TournamentGame
        {
            Address = "addressA",
        };
        var tournamentGameDtoA = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressA",
        };
        var teams = new[]
        {
            teamA,
            teamB,
            teamC,
        };
        var teamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>
        {
            { teamA.Id, homeDivision },
            { teamB.Id, awayDivision },
            { teamC.Id, homeDivision },
        };
        _user!.Access!.ManageTournaments = true;
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(tournamentGameA, _token))
            .ReturnsAsync(tournamentGameDtoA);
        _divisionFixtureAdapter.Setup(a => a.Adapt(game, teamA, teamB, homeDivision, awayDivision, _token)).ReturnsAsync(gameDto);

        var result = await _adapter.Adapt(
            _date,
            new[]
            {
                game,
            },
            new[]
            {
                tournamentGameA,
            },
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CosmosGame>(),
            true,
            teamIdToDivisionLookup,
            _token);

        _divisionFixtureAdapter.Verify(a => a.ForUnselectedTeam(It.IsAny<TeamDto>(), It.IsAny<bool>(), It.IsAny<IReadOnlyCollection<CosmosGame>>(), It.IsAny<DivisionDto?>(), _token), Times.Never);
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[]
        {
            gameDto,
        }));
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[]
        {
            tournamentGameDtoA,
        }));
        Assert.That(result.Notes, Is.Empty);
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task Adapt_WhenLoggedInAndNoTournamentGamesExist_IncludesByes(bool manageGames)
    {
        var homeDivision = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME DIVISION",
        };
        var awayDivision = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY DIVISION",
        };
        var teamA = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "A",
        };
        var teamB = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "B",
        };
        var teamC = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "C",
        };
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = teamA.Id,
            },
            Away = new GameTeam
            {
                Id = teamB.Id,
            },
        };
        var gameDto = new DivisionFixtureDto
        {
            Id = game.Id,
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        var byeDto = new DivisionFixtureDto
        {
            Id = Guid.NewGuid(),
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        var tournamentGamesForDate = Array.Empty<TournamentGame>();
        var teams = new[]
        {
            teamA,
            teamB,
            teamC,
        };
        var teamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>
        {
            { teamA.Id, homeDivision },
            { teamB.Id, awayDivision },
            { teamC.Id, homeDivision },
        };
        _user!.Access!.ManageGames = manageGames;
        _divisionFixtureAdapter.Setup(a => a.Adapt(game, teamA, teamB, homeDivision, awayDivision, _token)).ReturnsAsync(gameDto);
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(teamC, false, Array.Empty<CosmosGame>(), homeDivision, _token)).ReturnsAsync(byeDto);

        var result = await _adapter.Adapt(
            _date,
            new[]
            {
                game,
            },
            tournamentGamesForDate,
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CosmosGame>(),
            true,
            teamIdToDivisionLookup,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[]
        {
            gameDto, byeDto,
        }));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task Adapt_WhenLoggedInAndNoTournamentGamesExistButExcludesProposals_OnlyReturnsExistingFixtures(bool manageGames)
    {
        var homeDivision = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME DIVISION",
        };
        var awayDivision = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY DIVISION",
        };
        var teamA = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "A",
        };
        var teamB = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "B",
        };
        var teamC = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "C",
        };
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = teamA.Id,
            },
            Away = new GameTeam
            {
                Id = teamB.Id,
            },
        };
        var gameDto = new DivisionFixtureDto
        {
            Id = game.Id,
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        var tournamentGamesForDate = Array.Empty<TournamentGame>();
        var teams = new[]
        {
            teamA,
            teamB,
            teamC,
        };
        var teamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>
        {
            { teamA.Id, homeDivision },
            { teamB.Id, awayDivision },
            { teamC.Id, homeDivision },
        };
        _user!.Access!.ManageGames = manageGames;
        _divisionFixtureAdapter.Setup(a => a.Adapt(game, teamA, teamB, homeDivision, awayDivision, _token)).ReturnsAsync(gameDto);

        var result = await _adapter.Adapt(
            _date,
            new[]
            {
                game,
            },
            tournamentGamesForDate,
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CosmosGame>(),
            false,
            teamIdToDivisionLookup,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[]
        {
            gameDto,
        }));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenLoggedInAndNoTournamentGamesExist_HighlightsByesWhereAddressInUseInAnotherDivision()
    {
        var homeDivision = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME DIVISION",
        };
        var awayDivision = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY DIVISION",
        };
        var teamA = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "A",
            Address = "Common address",
        };
        var teamB = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "B",
            Address = "Team B address",
        };
        var teamC = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "C",
            Address = "Common address",
        };
        var teamD = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "D",
            Address = "Team D address",
        };
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = teamA.Id,
            },
            Away = new GameTeam
            {
                Id = teamB.Id,
            },
        };
        var otherDivisionGame = new CosmosGame
        {
            Address = teamC.Address,
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = teamC.Id,
            },
            Away = new GameTeam
            {
                Id = teamD.Id,
            },
        };
        var gameDto = new DivisionFixtureDto
        {
            Id = game.Id,
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        var byeDto = new DivisionFixtureDto
        {
            Id = Guid.NewGuid(),
            HomeTeam = new DivisionFixtureTeamDto(),
            FixturesUsingAddress = new List<OtherDivisionFixtureDto>(),
        };
        var tournamentGamesForDate = Array.Empty<TournamentGame>();
        var teams = new[]
        {
            teamA,
            teamB,
            teamC,
        };
        var teamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>
        {
            { teamA.Id, homeDivision },
            { teamB.Id, awayDivision },
            { teamC.Id, homeDivision },
        };
        _user!.Access!.ManageGames = true;
        _divisionFixtureAdapter.Setup(a => a.Adapt(game, teamA, teamB, homeDivision, awayDivision, _token)).ReturnsAsync(gameDto);
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(teamC, false, new[]
        {
            otherDivisionGame,
        }, homeDivision, _token)).ReturnsAsync(byeDto);

        var result = await _adapter.Adapt(
            _date,
            new[]
            {
                game,
            },
            tournamentGamesForDate,
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
            gameDto, byeDto,
        }));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenLoggedOutAndNoTournamentGamesExist_IncludesByes()
    {
        var homeDivision = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME DIVISION",
        };
        var awayDivision = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY DIVISION",
        };
        var teamA = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "A",
        };
        var teamB = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "B",
        };
        var teamC = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "C",
        };
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = teamA.Id,
            },
            Away = new GameTeam
            {
                Id = teamB.Id,
            },
        };
        var gameDto = new DivisionFixtureDto
        {
            Id = game.Id,
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        var byeDto = new DivisionFixtureDto
        {
            Id = Guid.NewGuid(),
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        var tournamentGamesForDate = Array.Empty<TournamentGame>();
        var teams = new[]
        {
            teamA,
            teamB,
            teamC,
        };
        var teamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>
        {
            { teamA.Id, homeDivision },
            { teamB.Id, awayDivision },
            { teamC.Id, homeDivision },
        };
        _user = null;
        _divisionFixtureAdapter.Setup(a => a.Adapt(game, teamA, teamB, homeDivision, awayDivision, _token)).ReturnsAsync(gameDto);
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(teamC, false, Array.Empty<CosmosGame>(), homeDivision, _token)).ReturnsAsync(byeDto);

        var result = await _adapter.Adapt(
            _date,
            new[]
            {
                game,
            },
            tournamentGamesForDate,
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CosmosGame>(),
            true,
            teamIdToDivisionLookup,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[]
        {
            gameDto, byeDto,
        }));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenKnockoutGamesExist_SetsHasKnockoutTrue()
    {
        var homeDivision = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "HOME DIVISION",
        };
        var awayDivision = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "AWAY DIVISION",
        };
        var teamA = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "A",
        };
        var teamB = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "B",
        };
        var teamC = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "C",
        };
        var game = new CosmosGame
        {
            Id = Guid.NewGuid(),
            Home = new GameTeam
            {
                Id = teamA.Id,
            },
            Away = new GameTeam
            {
                Id = teamB.Id,
            },
            IsKnockout = true,
        };
        var gameDto = new DivisionFixtureDto
        {
            Id = game.Id,
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        var proposedGameDto = new DivisionFixtureDto
        {
            Id = Guid.NewGuid(),
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        var tournamentGamesForDate = Array.Empty<TournamentGame>();
        var teams = new[]
        {
            teamA,
            teamB,
            teamC,
        };
        var teamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>
        {
            { teamA.Id, homeDivision },
            { teamB.Id, awayDivision },
            { teamC.Id, homeDivision },
        };
        _user = null;
        _divisionFixtureAdapter.Setup(a => a.Adapt(game, teamA, teamB, homeDivision, awayDivision, _token)).ReturnsAsync(gameDto);
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(teamC, true, Array.Empty<CosmosGame>(), homeDivision, _token)).ReturnsAsync(proposedGameDto);

        var result = await _adapter.Adapt(
            _date,
            new[]
            {
                game,
            },
            tournamentGamesForDate,
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CosmosGame>(),
            true,
            teamIdToDivisionLookup,
            _token);

        _divisionFixtureAdapter.Verify(a => a.ForUnselectedTeam(teamC, true, Array.Empty<CosmosGame>(), homeDivision, _token));
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[]
        {
            gameDto, proposedGameDto,
        }));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_GivenNotes_AdaptsNotesForDate()
    {
        var gamesForDate = Array.Empty<CosmosGame>();
        var tournamentGamesForDate = Array.Empty<TournamentGame>();
        var note = new FixtureDateNoteDto();
        var notesForDate = new List<FixtureDateNoteDto>
        {
            note,
        };
        var teams = Array.Empty<TeamDto>();
        var teamIdToDivisionLookup = new Dictionary<Guid, DivisionDto?>();
        _user!.Access!.ManageTournaments = true;

        var result = await _adapter.Adapt(
            _date,
            gamesForDate,
            tournamentGamesForDate,
            notesForDate,
            teams,
            Array.Empty<CosmosGame>(),
            true,
            teamIdToDivisionLookup,
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Notes, Is.EqualTo(new[]
        {
            note,
        }));
    }
}