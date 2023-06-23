using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionFixtureDateAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly DateTime _date = new DateTime(2001, 02, 03);

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
            Access = new AccessDto()
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
        var gamesForDate = Array.Empty<CourageScores.Models.Cosmos.Game.Game>();
        var tournamentGameDtoA = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressA",
        };
        var teamA = new TeamDto { Id = Guid.NewGuid(), Address = "addressA", Name = "A", };
        var teamB = new TeamDto { Id = Guid.NewGuid(), Address = "addressB", Name = "B", };
        var tournamentGameA = new TournamentGame { Address = "addressA", };
        var teams = new[] { teamA, teamB };
        _user = null;
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(tournamentGameA, _token))
            .ReturnsAsync(tournamentGameDtoA);

        var result = await _adapter.Adapt(
            _date,
            gamesForDate,
            new[] { tournamentGameA },
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CourageScores.Models.Cosmos.Game.Game>(),
            _token);

        _divisionTournamentFixtureDetailsAdapter.Verify(a => a.ForUnselectedVenue(It.IsAny<IEnumerable<TeamDto>>(), _token), Times.Never);
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[] { tournamentGameDtoA }));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenNotPermittedToCreateGames_DoesNotIncludeTournamentProposals()
    {
        var gamesForDate = Array.Empty<CourageScores.Models.Cosmos.Game.Game>();
        var tournamentGameDtoA = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressA",
        };
        var teamA = new TeamDto { Id = Guid.NewGuid(), Address = "addressA", Name = "A", };
        var teamB = new TeamDto { Id = Guid.NewGuid(), Address = "addressB", Name = "B", };
        var tournamentGameA = new TournamentGame { Address = "addressA", };
        var teams = new[] { teamA, teamB };
        _user!.Access!.ManageGames = false;
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(tournamentGameA, _token))
            .ReturnsAsync(tournamentGameDtoA);

        var result = await _adapter.Adapt(
            _date,
            gamesForDate,
            new[] { tournamentGameA },
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CourageScores.Models.Cosmos.Game.Game>(),
            _token);

        _divisionTournamentFixtureDetailsAdapter.Verify(a => a.ForUnselectedVenue(It.IsAny<IEnumerable<TeamDto>>(), _token), Times.Never);
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[] { tournamentGameDtoA }));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenCanManageGames_IncludesTournamentProposals()
    {
        var gamesForDate = Array.Empty<CourageScores.Models.Cosmos.Game.Game>();
        var tournamentGameDtoA = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressA",
        };
        var tournamentGameDtoB = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressB",
        };
        var teamA = new TeamDto { Id = Guid.NewGuid(), Address = "addressA", Name = "A", };
        var teamB = new TeamDto { Id = Guid.NewGuid(), Address = "addressB", Name = "B", };
        var tournamentGameA = new TournamentGame { Address = "addressA", };
        var teams = new[] { teamA, teamB };
        _user!.Access!.ManageTournaments = true;
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(tournamentGameA, _token))
            .ReturnsAsync(tournamentGameDtoA);
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.ForUnselectedVenue(new[] { teamB }, _token))
            .ReturnsAsync(tournamentGameDtoB);

        var result = await _adapter.Adapt(
            _date,
            gamesForDate,
            new[] { tournamentGameA },
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CourageScores.Models.Cosmos.Game.Game>(),
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[] { tournamentGameDtoA, tournamentGameDtoB }));
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenTournamentGamesExist_DoesNotIncludeGameProposals()
    {
        var teamA = new TeamDto { Id = Guid.NewGuid(), Address = "addressA", Name = "A", };
        var teamB = new TeamDto { Id = Guid.NewGuid(), Address = "addressB", Name = "B", };
        var teamC = new TeamDto { Id = Guid.NewGuid(), Address = "addressC", Name = "C", };
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            Id = Guid.NewGuid(),
            Home = new GameTeam { Id = teamA.Id },
            Away = new GameTeam { Id = teamB.Id },
        };
        var gameDto = new DivisionFixtureDto
        {
            Id = game.Id,
            HomeTeam = new DivisionFixtureTeamDto(),
        };
        var tournamentGameA = new TournamentGame { Address = "addressA", };
        var tournamentGameDtoA = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressA",
        };
        var tournamentGameDtoB = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressB",
        };
        var tournamentGameDtoC = new DivisionTournamentFixtureDetailsDto
        {
            Address = "addressC",
        };
        var teams = new[] { teamA, teamB, teamC };
        _user!.Access!.ManageTournaments = true;
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.Adapt(tournamentGameA, _token))
            .ReturnsAsync(tournamentGameDtoA);
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.ForUnselectedVenue(new[] { teamB }, _token))
            .ReturnsAsync(tournamentGameDtoB);
        _divisionTournamentFixtureDetailsAdapter
            .Setup(a => a.ForUnselectedVenue(new[] { teamC }, _token))
            .ReturnsAsync(tournamentGameDtoC);
        _divisionFixtureAdapter.Setup(a => a.Adapt(game, teamA, teamB, _token)).ReturnsAsync(gameDto);

        var result = await _adapter.Adapt(
            _date,
            new[] { game },
            new[] { tournamentGameA },
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CourageScores.Models.Cosmos.Game.Game>(),
            _token);

        _divisionFixtureAdapter.Verify(a => a.ForUnselectedTeam(It.IsAny<TeamDto>(), It.IsAny<bool>(), _token), Times.Never);
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[] { gameDto }));
        Assert.That(result.TournamentFixtures, Is.EqualTo(new[] { tournamentGameDtoA, tournamentGameDtoB, tournamentGameDtoC }));
        Assert.That(result.Notes, Is.Empty);
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task Adapt_WhenLoggedInAndNoTournamentGamesExist_IncludesGameProposals(bool manageGames)
    {
        var teamA = new TeamDto { Id = Guid.NewGuid(), Name = "A", };
        var teamB = new TeamDto { Id = Guid.NewGuid(), Name = "B", };
        var teamC = new TeamDto { Id = Guid.NewGuid(), Name = "C", };
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            Id = Guid.NewGuid(),
            Home = new GameTeam { Id = teamA.Id },
            Away = new GameTeam { Id = teamB.Id },
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
        var teams = new[] { teamA, teamB, teamC };
        _user!.Access!.ManageGames = manageGames;
        _divisionFixtureAdapter.Setup(a => a.Adapt(game, teamA, teamB, _token)).ReturnsAsync(gameDto);
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(teamC, false, _token)).ReturnsAsync(proposedGameDto);

        var result = await _adapter.Adapt(
            _date,
            new[] { game },
            tournamentGamesForDate,
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CourageScores.Models.Cosmos.Game.Game>(),
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[] { gameDto, proposedGameDto }));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenLoggedOutAndNoTournamentGamesExist_IncludesGameProposals()
    {
        var teamA = new TeamDto { Id = Guid.NewGuid(), Name = "A", };
        var teamB = new TeamDto { Id = Guid.NewGuid(), Name = "B", };
        var teamC = new TeamDto { Id = Guid.NewGuid(), Name = "C", };
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            Id = Guid.NewGuid(),
            Home = new GameTeam { Id = teamA.Id },
            Away = new GameTeam { Id = teamB.Id },
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
        var teams = new[] { teamA, teamB, teamC };
        _user = null;
        _divisionFixtureAdapter.Setup(a => a.Adapt(game, teamA, teamB, _token)).ReturnsAsync(gameDto);
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(teamC, false, _token)).ReturnsAsync(proposedGameDto);

        var result = await _adapter.Adapt(
            _date,
            new[] { game },
            tournamentGamesForDate,
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CourageScores.Models.Cosmos.Game.Game>(),
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[] { gameDto, proposedGameDto }));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_WhenKnockoutGamesExist_SetsHasKnockoutTrue()
    {
        var teamA = new TeamDto { Id = Guid.NewGuid(), Name = "A", };
        var teamB = new TeamDto { Id = Guid.NewGuid(), Name = "B", };
        var teamC = new TeamDto { Id = Guid.NewGuid(), Name = "C", };
        var game = new CourageScores.Models.Cosmos.Game.Game
        {
            Id = Guid.NewGuid(),
            Home = new GameTeam { Id = teamA.Id },
            Away = new GameTeam { Id = teamB.Id },
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
        var teams = new[] { teamA, teamB, teamC };
        _user = null;
        _divisionFixtureAdapter.Setup(a => a.Adapt(game, teamA, teamB, _token)).ReturnsAsync(gameDto);
        _divisionFixtureAdapter.Setup(a => a.ForUnselectedTeam(teamC, true, _token)).ReturnsAsync(proposedGameDto);

        var result = await _adapter.Adapt(
            _date,
            new[] { game },
            tournamentGamesForDate,
            Array.Empty<FixtureDateNoteDto>(),
            teams,
            Array.Empty<CourageScores.Models.Cosmos.Game.Game>(),
            _token);

        _divisionFixtureAdapter.Verify(a => a.ForUnselectedTeam(teamC, true, _token));
        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Fixtures, Is.EqualTo(new[] { gameDto, proposedGameDto }));
        Assert.That(result.TournamentFixtures, Is.Empty);
        Assert.That(result.Notes, Is.Empty);
    }

    [Test]
    public async Task Adapt_GivenNotes_AdaptsNotesForDate()
    {
        var gamesForDate = Array.Empty<CourageScores.Models.Cosmos.Game.Game>();
        var tournamentGamesForDate = Array.Empty<TournamentGame>();
        var note = new FixtureDateNoteDto();
        var notesForDate = new List<FixtureDateNoteDto> { note };
        var teams = Array.Empty<TeamDto>();
        _user!.Access!.ManageTournaments = true;

        var result = await _adapter.Adapt(
            _date,
            gamesForDate,
            tournamentGamesForDate,
            notesForDate,
            teams,
            Array.Empty<CourageScores.Models.Cosmos.Game.Game>(),
            _token);

        Assert.That(result.Date, Is.EqualTo(_date));
        Assert.That(result.Notes, Is.EqualTo(new[] { note }));
    }
}