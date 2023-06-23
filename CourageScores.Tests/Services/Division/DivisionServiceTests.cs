using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using CourageScores.Services.Team;
using Microsoft.AspNetCore.Authentication;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionServiceTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly List<TeamDto> _allTeams = new();
    private readonly List<FixtureDateNoteDto> _someNotes = new();
    private readonly List<CosmosGame> _someGames = new();
    private readonly List<TournamentGame> _someTournaments = new();
    private DivisionService _service = null!;
    private Mock<IGenericDataService<CourageScores.Models.Cosmos.Division,DivisionDto>> _genericService = null!;
    private Mock<ITeamService> _teamService = null!;
    private Mock<IGenericDataService<CourageScores.Models.Cosmos.Season,SeasonDto>> _genericSeasonService = null!;
    private Mock<IGenericRepository<CosmosGame>> _gameRepository = null!;
    private Mock<IGenericRepository<TournamentGame>> _tournamentGameRepository = null!;
    private Mock<IGenericDataService<FixtureDateNote,FixtureDateNoteDto>> _noteService = null!;
    private Mock<ISystemClock> _clock = null!;
    private Mock<IDivisionDataDtoFactory> _divisionDataDtoFactory = null!;
    private Mock<IUserService> _userService = null!;
    private DivisionDataContext? _divisionDataContext;
    private UserDto? _userDto;

    [SetUp]
    public void SetupEachTest()
    {
        _genericService = new Mock<IGenericDataService<CourageScores.Models.Cosmos.Division, DivisionDto>>();
        _teamService = new Mock<ITeamService>();
        _genericSeasonService = new Mock<IGenericDataService<CourageScores.Models.Cosmos.Season, SeasonDto>>();
        _gameRepository = new Mock<IGenericRepository<CosmosGame>>();
        _tournamentGameRepository = new Mock<IGenericRepository<TournamentGame>>();
        _noteService = new Mock<IGenericDataService<FixtureDateNote, FixtureDateNoteDto>>();
        _userService = new Mock<IUserService>();
        _clock = new Mock<ISystemClock>();
        _divisionDataDtoFactory = new Mock<IDivisionDataDtoFactory>();
        _someGames.Clear();
        _someNotes.Clear();
        _someTournaments.Clear();
        _allTeams.Clear();

        _service = new DivisionService(
            _genericService.Object,
            _teamService.Object,
            _genericSeasonService.Object,
            _gameRepository.Object,
            _tournamentGameRepository.Object,
            _noteService.Object,
            _clock.Object,
            _divisionDataDtoFactory.Object,
            _userService.Object);

        _teamService.Setup(s => s.GetAll(_token)).Returns(() => TestUtilities.AsyncEnumerable(_allTeams.ToArray()));
        _noteService.Setup(s => s.GetWhere(It.IsAny<string>(), _token)).Returns(() => TestUtilities.AsyncEnumerable(_someNotes.ToArray()));
        _gameRepository.Setup(s => s.GetSome(It.IsAny<string>(), _token)).Returns(() => TestUtilities.AsyncEnumerable(_someGames.ToArray()));
        _tournamentGameRepository.Setup(s => s.GetSome(It.IsAny<string>(), _token)).Returns(() => TestUtilities.AsyncEnumerable(_someTournaments.ToArray()));
        _divisionDataDtoFactory
            .Setup(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), It.IsAny<DivisionDto>(), _token))
            .Callback((DivisionDataContext context, DivisionDto _, CancellationToken _) =>
            {
                _divisionDataContext = context;
            });
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _userDto);
    }

    [Test]
    public async Task? GetDivisionData_GivenNoSeasonOrDivisionId_ReturnsInsufficientInput()
    {
        var insufficientData = new DivisionDataDto();
        var filter = new DivisionDataFilter();
        _divisionDataDtoFactory.Setup(f => f.DivisionIdAndSeasonIdNotSupplied()).Returns(insufficientData);

        var result = await _service.GetDivisionData(filter, _token);

        Assert.That(result, Is.SameAs(insufficientData));
    }

    [Test]
    public async Task? GetDivisionData_GivenDivisionIdFilterWhenDivisionNotFound_ReturnsDivisionNotFound()
    {
        var notFound = new DivisionDataDto();
        var filter = new DivisionDataFilter { DivisionId = Guid.NewGuid() };
        _divisionDataDtoFactory.Setup(f => f.DivisionNotFound(filter.DivisionId.Value, null)).Returns(notFound);
        _genericService.Setup(s => s.Get(filter.DivisionId.Value, _token)).ReturnsAsync(() => null);

        var result = await _service.GetDivisionData(filter, _token);

        Assert.That(result, Is.SameAs(notFound));
    }

    [Test]
    public async Task? GetDivisionData_GivenDivisionIdFilterWhenDivisionDeleted_ReturnsDivisionNotFound()
    {
        var notFound = new DivisionDataDto();
        var division = new DivisionDto { Deleted = new DateTime(2001, 02, 03) };
        var filter = new DivisionDataFilter { DivisionId = Guid.NewGuid() };
        _divisionDataDtoFactory.Setup(f => f.DivisionNotFound(filter.DivisionId.Value, division)).Returns(notFound);
        _genericService.Setup(s => s.Get(filter.DivisionId.Value, _token)).ReturnsAsync(division);

        var result = await _service.GetDivisionData(filter, _token);

        Assert.That(result, Is.SameAs(notFound));
    }

    [Test]
    public async Task? GetDivisionData_GivenSeasonIdFilterWhenSeasonNotFound_ReturnsSeasonNotFound()
    {
        var seasonNotFound = new DivisionDataDto();
        var division = new DivisionDto { Id = Guid.NewGuid() };
        var filter = new DivisionDataFilter { DivisionId = Guid.NewGuid(), SeasonId = Guid.NewGuid() };
        var otherSeason = new SeasonDto { Id = Guid.NewGuid(), StartDate = new DateTime(2001, 01, 01), EndDate = new DateTime(2001, 05, 01) };
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(division, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(seasonNotFound);
        _genericService.Setup(s => s.Get(filter.DivisionId.Value, _token)).ReturnsAsync(division);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(otherSeason));

        var result = await _service.GetDivisionData(filter, _token);

        _genericSeasonService.Verify(s => s.GetAll(_token));
        Assert.That(result, Is.SameAs(seasonNotFound));
    }

    [Test]
    public async Task? GetDivisionData_GivenNoSeasonIdFilterAndNoSeasons_ReturnsSeasonNotFound()
    {
        var seasonNotFound = new DivisionDataDto();
        var division = new DivisionDto { Id = Guid.NewGuid() };
        var filter = new DivisionDataFilter { DivisionId = Guid.NewGuid() };
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(division, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(seasonNotFound);
        _genericService.Setup(s => s.Get(filter.DivisionId.Value, _token)).ReturnsAsync(division);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<SeasonDto>());

        var result = await _service.GetDivisionData(filter, _token);

        _genericSeasonService.Verify(s => s.GetAll(_token));
        Assert.That(result, Is.SameAs(seasonNotFound));
    }

    [Test]
    public async Task? GetDivisionData_GivenNoSeasonIdFilterWhenNoActiveSeasons_ReturnsSeasonNotFound()
    {
        var seasonNotFound = new DivisionDataDto();
        var division = new DivisionDto { Id = Guid.NewGuid() };
        var filter = new DivisionDataFilter { DivisionId = Guid.NewGuid() };
        var otherSeason = new SeasonDto
        {
            Id = Guid.NewGuid(),
            StartDate = new DateTime(2001, 01, 01),
            EndDate = new DateTime(2001, 05, 01)
        };
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(division, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(seasonNotFound);
        _genericService.Setup(s => s.Get(filter.DivisionId.Value, _token)).ReturnsAsync(division);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(otherSeason));
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(2001, 06, 01, 0, 0, 0, TimeSpan.Zero));

        var result = await _service.GetDivisionData(filter, _token);

        _genericSeasonService.Verify(s => s.GetAll(_token));
        Assert.That(result, Is.SameAs(seasonNotFound));
    }

    [Test]
    public async Task? GetDivisionData_GivenNoSeasonIdFilterWhenTwoActiveSeasons_UsesSeasonWithGreatestEndDate()
    {
        var data = new DivisionDataDto();
        var division = new DivisionDto { Id = Guid.NewGuid() };
        var filter = new DivisionDataFilter { DivisionId = Guid.NewGuid() };
        var firstSeason = new SeasonDto { Id = Guid.NewGuid(), StartDate = new DateTime(2001, 01, 01), EndDate = new DateTime(2001, 05, 01) };
        var secondSeason = new SeasonDto { Id = Guid.NewGuid(), StartDate = new DateTime(2001, 01, 01), EndDate = new DateTime(2001, 06, 01) };
        var thirdSeason = new SeasonDto { Id = Guid.NewGuid(), StartDate = new DateTime(2001, 04, 01), EndDate = new DateTime(2001, 07, 01) };
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(division, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(data);
        _genericService.Setup(s => s.Get(filter.DivisionId.Value, _token)).ReturnsAsync(division);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(firstSeason, secondSeason, thirdSeason));
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(2001, 03, 01, 0, 0, 0, TimeSpan.Zero));

        await _service.GetDivisionData(filter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), division, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.Season, Is.EqualTo(secondSeason));
    }

    [Test]
    public async Task? GetDivisionData_GivenDivisionIdFilter_IncludesMatchingTeamsOnly()
    {
        var data = new DivisionDataDto();
        var division = new DivisionDto { Id = Guid.NewGuid() };
        var filter = new DivisionDataFilter { DivisionId = division.Id };
        var firstSeason = new SeasonDto { Id = Guid.NewGuid(), StartDate = new DateTime(2001, 01, 01), EndDate = new DateTime(2001, 05, 01) };
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Seasons = { new TeamSeasonDto { SeasonId = firstSeason.Id, DivisionId = division.Id } }
        };
        var otherDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Seasons = { new TeamSeasonDto { SeasonId = firstSeason.Id, DivisionId = Guid.NewGuid() } }
        };
        _allTeams.AddRange(new[] { team, otherDivisionTeam });
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(division, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(data);
        _genericService.Setup(s => s.Get(filter.DivisionId.Value, _token)).ReturnsAsync(division);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(firstSeason));
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(2001, 03, 01, 0, 0, 0, TimeSpan.Zero));

        await _service.GetDivisionData(filter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), division, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.TeamsInSeasonAndDivision, Is.EquivalentTo(new[] { team }));
    }

    [Test]
    public async Task? GetDivisionData_GivenNoDivisionIdFilter_IncludesAllTeams()
    {
        var data = new DivisionDataDto();
        var division = new DivisionDto { Id = Guid.NewGuid() };
        var season = new SeasonDto { Id = Guid.NewGuid(), StartDate = new DateTime(2001, 01, 01), EndDate = new DateTime(2001, 05, 01) };
        var filter = new DivisionDataFilter { SeasonId = season.Id };
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Seasons = { new TeamSeasonDto { SeasonId = season.Id, DivisionId = division.Id } }
        };
        var otherDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Seasons = { new TeamSeasonDto { SeasonId = season.Id, DivisionId = division.Id } }
        };
        _allTeams.AddRange(new[] { team, otherDivisionTeam });
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(division, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(data);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(season));
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(2001, 03, 01, 0, 0, 0, TimeSpan.Zero));

        await _service.GetDivisionData(filter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), null, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.TeamsInSeasonAndDivision, Is.EquivalentTo(_allTeams));
    }

    [Test]
    public async Task? GetDivisionData_GivenDivisionIdFilter_IncludesMatchingNotesOnly()
    {
        var data = new DivisionDataDto();
        var division = new DivisionDto { Id = Guid.NewGuid() };
        var filter = new DivisionDataFilter { DivisionId = division.Id };
        var season = new SeasonDto { Id = Guid.NewGuid(), StartDate = new DateTime(2001, 01, 01), EndDate = new DateTime(2001, 05, 01) };
        var note = new FixtureDateNoteDto { Id = Guid.NewGuid(), DivisionId = division.Id };
        var otherDivisionNote = new FixtureDateNoteDto { Id = Guid.NewGuid(), DivisionId = Guid.NewGuid() };
        var allDivisionsNote = new FixtureDateNoteDto { Id = Guid.NewGuid(), DivisionId = null };
        _someNotes.AddRange(new[] { note, otherDivisionNote, allDivisionsNote });
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(division, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(data);
        _genericService.Setup(s => s.Get(filter.DivisionId.Value, _token)).ReturnsAsync(division);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(season));
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(2001, 03, 01, 0, 0, 0, TimeSpan.Zero));

        await _service.GetDivisionData(filter, _token);

        _noteService.Verify(s => s.GetWhere($"t.SeasonId = '{season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), division, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.Notes.Values.SelectMany(n => n), Is.EquivalentTo(new[] { note, allDivisionsNote }));
    }

    [Test]
    public async Task? GetDivisionData_GivenNoDivisionIdFilter_IncludesAllNotes()
    {
        var data = new DivisionDataDto();
        var division = new DivisionDto { Id = Guid.NewGuid() };
        var season = new SeasonDto { Id = Guid.NewGuid(), StartDate = new DateTime(2001, 01, 01), EndDate = new DateTime(2001, 05, 01) };
        var filter = new DivisionDataFilter { SeasonId = season.Id };
        var note = new FixtureDateNoteDto { Id = Guid.NewGuid(), DivisionId = division.Id };
        var otherDivisionNote = new FixtureDateNoteDto { Id = Guid.NewGuid(), DivisionId = Guid.NewGuid() };
        var allDivisionsNote = new FixtureDateNoteDto { Id = Guid.NewGuid(), DivisionId = null };
        _someNotes.AddRange(new[] { note, otherDivisionNote, allDivisionsNote });
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(division, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(data);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(season));
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(2001, 03, 01, 0, 0, 0, TimeSpan.Zero));

        await _service.GetDivisionData(filter, _token);

        _noteService.Verify(s => s.GetWhere($"t.SeasonId = '{season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), null, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.Notes.Values.SelectMany(n => n), Is.EquivalentTo(_someNotes));
    }

    [Test]
    public async Task? GetDivisionData_GivenDivisionIdFilter_IncludesMatchingGamesWithinSeason()
    {
        var data = new DivisionDataDto();
        var division = new DivisionDto { Id = Guid.NewGuid() };
        var filter = new DivisionDataFilter { DivisionId = division.Id };
        var season = new SeasonDto { Id = Guid.NewGuid(), StartDate = new DateTime(2001, 01, 01), EndDate = new DateTime(2001, 05, 01) };
        var givenDivisionGameInSeason = new CosmosGame { Id = Guid.NewGuid(), DivisionId = division.Id, Date = new DateTime(2001, 02, 01) };
        var givenDivisionGameOutOfSeason = new CosmosGame { Id = Guid.NewGuid(), DivisionId = division.Id, Date = new DateTime(2001, 06, 01) };
        _someGames.AddRange(new[] { givenDivisionGameInSeason, givenDivisionGameOutOfSeason });
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(division, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(data);
        _genericService.Setup(s => s.Get(filter.DivisionId.Value, _token)).ReturnsAsync(division);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(season));
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(2001, 03, 01, 0, 0, 0, TimeSpan.Zero));

        await _service.GetDivisionData(filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.DivisionId = '{division.Id}' or t.IsKnockout = true", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), division, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[] { givenDivisionGameInSeason }));
    }

    [Test]
    public async Task? GetDivisionData_GivenNoDivisionIdFilter_IncludesAllGamesWithinSeason()
    {
        var data = new DivisionDataDto();
        var division = new DivisionDto { Id = Guid.NewGuid() };
        var season = new SeasonDto { Id = Guid.NewGuid(), StartDate = new DateTime(2001, 01, 01), EndDate = new DateTime(2001, 05, 01) };
        var filter = new DivisionDataFilter { SeasonId = season.Id };
        var givenDivisionGameInSeason = new CosmosGame { Id = Guid.NewGuid(), DivisionId = division.Id, Date = new DateTime(2001, 02, 01) };
        var givenDivisionGameOutOfSeason = new CosmosGame { Id = Guid.NewGuid(), DivisionId = division.Id, Date = new DateTime(2001, 06, 01) };
        var otherDivisionGameInSeason = new CosmosGame { Id = Guid.NewGuid(), DivisionId = Guid.NewGuid(), Date = new DateTime(2001, 02, 01) };
        var otherDivisionGameOutOfSeason = new CosmosGame { Id = Guid.NewGuid(), DivisionId = Guid.NewGuid(), Date = new DateTime(2001, 06, 01) };
        _someGames.AddRange(new[] { givenDivisionGameInSeason, givenDivisionGameOutOfSeason, otherDivisionGameInSeason, otherDivisionGameOutOfSeason });
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(division, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(data);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(season));
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(2001, 03, 01, 0, 0, 0, TimeSpan.Zero));

        await _service.GetDivisionData(filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.SeasonId = '{season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), null, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[] { givenDivisionGameInSeason, otherDivisionGameInSeason }));
    }

    [Test]
    public async Task? GetDivisionData_GivenDivisionIdFilter_IncludesMatchingTournamentsWithinSeason()
    {
        var data = new DivisionDataDto();
        var division = new DivisionDto { Id = Guid.NewGuid() };
        var filter = new DivisionDataFilter { DivisionId = division.Id };
        var season = new SeasonDto { Id = Guid.NewGuid(), StartDate = new DateTime(2001, 01, 01), EndDate = new DateTime(2001, 05, 01) };
        var inSeasonTournament = new TournamentGame { Id = Guid.NewGuid(), Date = new DateTime(2001, 02, 01) };
        var outOfSeasonTournament = new TournamentGame { Id = Guid.NewGuid(), Date = new DateTime(2001, 06, 01) };
        _someTournaments.AddRange(new[] { inSeasonTournament, outOfSeasonTournament });
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(division, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(data);
        _genericService.Setup(s => s.Get(filter.DivisionId.Value, _token)).ReturnsAsync(division);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(season));
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(2001, 03, 01, 0, 0, 0, TimeSpan.Zero));

        await _service.GetDivisionData(filter, _token);

        _tournamentGameRepository.Verify(s => s.GetSome($"t.SeasonId = '{season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), division, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllTournamentGames(division.Id), Is.EquivalentTo(new[] { inSeasonTournament }));
    }

    [Test]
    public async Task GetDivisionData_WhenLoggedInAndCannotManageGames_GetsFixturesForFilterDivisionOnly()
    {
        var data = new DivisionDataDto();
        var division = new DivisionDto { Id = Guid.NewGuid() };
        var season = new SeasonDto { Id = Guid.NewGuid(), StartDate = new DateTime(2001, 01, 01), EndDate = new DateTime(2001, 05, 01) };
        var filter = new DivisionDataFilter { SeasonId = season.Id, DivisionId = division.Id };
        var givenDivisionGameInSeason = new CosmosGame { Id = Guid.NewGuid(), DivisionId = division.Id, Date = new DateTime(2001, 02, 01) };
        var givenDivisionGameOutOfSeason = new CosmosGame { Id = Guid.NewGuid(), DivisionId = division.Id, Date = new DateTime(2001, 06, 01) };
        _someGames.AddRange(new[] { givenDivisionGameInSeason, givenDivisionGameOutOfSeason });
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(division, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(data);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(season));
        _genericService.Setup(s => s.Get(division.Id, _token)).ReturnsAsync(division);
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(2001, 03, 01, 0, 0, 0, TimeSpan.Zero));
        _userDto = new UserDto
        {
            Access = new AccessDto
            {
                ManageGames = false,
            }
        };

        await _service.GetDivisionData(filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.DivisionId = '{filter.DivisionId}' or t.IsKnockout = true", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), division, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[] { givenDivisionGameInSeason }));
    }

    [Test]
    public async Task GetDivisionData_WhenLoggedInAndCanManageGames_GetsFixturesForAllDivisions()
    {
        var data = new DivisionDataDto();
        var division = new DivisionDto { Id = Guid.NewGuid() };
        var season = new SeasonDto { Id = Guid.NewGuid(), StartDate = new DateTime(2001, 01, 01), EndDate = new DateTime(2001, 05, 01) };
        var filter = new DivisionDataFilter { SeasonId = season.Id, DivisionId = division.Id };
        var givenDivisionGameInSeason = new CosmosGame { Id = Guid.NewGuid(), DivisionId = division.Id, Date = new DateTime(2001, 02, 01) };
        var givenDivisionGameOutOfSeason = new CosmosGame { Id = Guid.NewGuid(), DivisionId = division.Id, Date = new DateTime(2001, 06, 01) };
        var otherDivisionGameInSeason = new CosmosGame { Id = Guid.NewGuid(), DivisionId = Guid.NewGuid(), Date = new DateTime(2001, 02, 01) };
        var otherDivisionGameOutOfSeason = new CosmosGame { Id = Guid.NewGuid(), DivisionId = Guid.NewGuid(), Date = new DateTime(2001, 06, 01) };
        _someGames.AddRange(new[] { givenDivisionGameInSeason, givenDivisionGameOutOfSeason, otherDivisionGameInSeason, otherDivisionGameOutOfSeason });
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(division, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(data);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(season));
        _genericService.Setup(s => s.Get(division.Id, _token)).ReturnsAsync(division);
        _clock.Setup(c => c.UtcNow).Returns(new DateTimeOffset(2001, 03, 01, 0, 0, 0, TimeSpan.Zero));
        _userDto = new UserDto
        {
            Access = new AccessDto
            {
                ManageGames = true,
            }
        };

        await _service.GetDivisionData(filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.SeasonId = '{season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), division, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[] { givenDivisionGameInSeason, otherDivisionGameInSeason }));
    }
}