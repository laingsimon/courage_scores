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
using CourageScores.Tests.Models.Cosmos.Game;
using CourageScores.Tests.Models.Dtos;
using Microsoft.AspNetCore.Authentication;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;
using CosmosSeason = CourageScores.Models.Cosmos.Season.Season;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionServiceTests
{
    private static readonly DivisionDto Division1 = new DivisionDtoBuilder(name: "DIVISION 1").Build();
    private static readonly DivisionDto Division2 = new DivisionDtoBuilder(name: "DIVISION 2").Build();
    private static readonly SeasonDto Season = new SeasonDtoBuilder()
        .WithDates(new DateTime(2001, 01, 01), new DateTime(2001, 05, 01))
        .Build();
    private static readonly DivisionDataFilter Division1Filter = new DivisionDataFilter
    {
        DivisionId = { Division1.Id },
    };
    private static readonly DivisionDataFilter Division1AndSeason1Filter = new DivisionDataFilter
    {
        SeasonId = Season.Id,
        DivisionId = { Division1.Id },
    };
    private static readonly TeamDto Division1Team = new TeamDtoBuilder()
        .WithSeason(s => s.ForSeason(Season, Division1))
        .Build();
    private static readonly TeamDto Division2Team = new TeamDtoBuilder()
        .WithSeason(s => s.ForSeason(Season, Division2))
        .Build();
    private static readonly DivisionDataDto Empty = new DivisionDataDto();
    private static readonly CosmosGame Division1GameInSeason = new GameBuilder()
        .ForDivision(Division1)
        .WithDate(new DateTime(2001, 02, 01))
        .Build();
    private static readonly CosmosGame Division1GameOutOfSeason = new GameBuilder()
        .ForDivision(Division1)
        .WithDate(new DateTime(2001, 06, 01))
        .Build();
    private static readonly CosmosGame Division2GameInSeason = new GameBuilder()
        .ForDivision(Division2)
        .WithDate(new DateTime(2001, 02, 01))
        .Build();
    private static readonly CosmosGame Division2GameOutOfSeason = new GameBuilder()
        .ForDivision(Division2)
        .WithDate(new DateTime(2001, 06, 01))
        .Build();
    private static readonly DivisionDataFilter SeasonIdFilter = new DivisionDataFilter
    {
        SeasonId = Season.Id,
    };

    private readonly CancellationToken _token = new();
    private readonly List<TeamDto> _allTeams = new();
    private readonly List<FixtureDateNoteDto> _someNotes = new();
    private readonly List<CosmosGame> _someGames = new();
    private readonly List<TournamentGame> _someTournaments = new();
    private DivisionService _service = null!;
    private Mock<IGenericDataService<CourageScores.Models.Cosmos.Division, DivisionDto>> _genericService = null!;
    private Mock<ICachingTeamService> _teamService = null!;
    private Mock<IGenericDataService<CosmosSeason, SeasonDto>> _genericSeasonService = null!;
    private Mock<IGenericRepository<CosmosGame>> _gameRepository = null!;
    private Mock<IGenericRepository<TournamentGame>> _tournamentGameRepository = null!;
    private Mock<IGenericDataService<FixtureDateNote, FixtureDateNoteDto>> _noteService = null!;
    private Mock<ISystemClock> _clock = null!;
    private Mock<IDivisionDataDtoFactory> _divisionDataDtoFactory = null!;
    private Mock<IUserService> _userService = null!;
    private DivisionDataContext? _divisionDataContext;
    private UserDto? _userDto;
    private DateTimeOffset _now;

    [SetUp]
    public void SetupEachTest()
    {
        _genericService = new Mock<IGenericDataService<CourageScores.Models.Cosmos.Division, DivisionDto>>();
        _teamService = new Mock<ICachingTeamService>();
        _genericSeasonService = new Mock<IGenericDataService<CosmosSeason, SeasonDto>>();
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
        _now = new DateTimeOffset(2001, 03, 01, 0, 0, 0, TimeSpan.Zero);

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
            .Setup(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), It.IsAny<IReadOnlyCollection<DivisionDto>>(), It.IsAny<bool>(), _token))
            .Callback((DivisionDataContext context, IReadOnlyCollection<DivisionDto> _, bool _, CancellationToken _) =>
            {
                _divisionDataContext = context;
            });
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _userDto);
        _genericService.Setup(s => s.Get(Division1.Id, _token)).ReturnsAsync(Division1);
        _genericService.Setup(s => s.Get(Division2.Id, _token)).ReturnsAsync(Division2);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(Season));
        _clock.Setup(c => c.UtcNow).Returns(() => _now);
    }

    [Test]
    public async Task GetDivisionData_GivenNoSeasonOrDivisionId_ReturnsInsufficientInput()
    {
        var filter = new DivisionDataFilter();
        _divisionDataDtoFactory.Setup(f => f.DivisionIdAndSeasonIdNotSupplied(It.IsAny<Guid?>())).Returns(Empty);

        var result = await _service.GetDivisionData(filter, _token);

        Assert.That(result, Is.SameAs(Empty));
    }

    [Test]
    public async Task GetDivisionData_GivenDivisionIdFilterWhenDivisionNotFound_ReturnsDivisionNotFound()
    {
        _divisionDataDtoFactory.Setup(f => f.DivisionNotFound(new[] { Division1.Id }, It.IsAny<IReadOnlyCollection<DivisionDto>>())).Returns(Empty);
        _genericService.Setup(s => s.Get(Division1.Id, _token)).ReturnsAsync(() => null);

        var result = await _service.GetDivisionData(Division1Filter, _token);

        Assert.That(result, Is.SameAs(Empty));
    }

    [Test]
    public async Task GetDivisionData_GivenDivisionIdFilterWhenDivisionDeleted_ReturnsDivisionNotFound()
    {
        var division = new DivisionDtoBuilder().Deleted(new DateTime(2001, 02, 03)).Build();
        var filter = new DivisionDataFilter
        {
            DivisionId = { division.Id },
        };
        _divisionDataDtoFactory.Setup(f => f.DivisionNotFound(
            filter.DivisionId,
            It.Is<IReadOnlyCollection<DivisionDto>>(divs => divs.Select(d => d.Id).SequenceEqual(new[] { division.Id })))).Returns(Empty);
        _genericService.Setup(s => s.Get(division.Id, _token)).ReturnsAsync(division);

        var result = await _service.GetDivisionData(filter, _token);

        Assert.That(result, Is.SameAs(Empty));
    }

    [Test]
    public async Task GetDivisionData_GivenSeasonIdFilterWhenSeasonNotFound_ReturnsSeasonNotFound()
    {
        var filter = new DivisionDataFilter
        {
            DivisionId = { Division1.Id },
            SeasonId = Guid.NewGuid(),
        };
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(new[] { Division1 }, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(Empty);

        var result = await _service.GetDivisionData(filter, _token);

        _genericSeasonService.Verify(s => s.GetAll(_token));
        Assert.That(result, Is.SameAs(Empty));
    }

    [Test]
    public async Task GetDivisionData_GivenNoSeasonIdFilterAndNoSeasons_ReturnsSeasonNotFound()
    {
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(new[] { Division1 }, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(Empty);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<SeasonDto>());

        var result = await _service.GetDivisionData(Division1Filter, _token);

        _genericSeasonService.Verify(s => s.GetAll(_token));
        Assert.That(result, Is.SameAs(Empty));
    }

    [Test]
    public async Task GetDivisionData_GivenNoSeasonIdFilterWhenNoActiveSeasons_ReturnsSeasonNotFound()
    {
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(new[] { Division1 }, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(Empty);
        _now = new DateTimeOffset(2001, 06, 01, 0, 0, 0, TimeSpan.Zero);

        var result = await _service.GetDivisionData(Division1Filter, _token);

        _genericSeasonService.Verify(s => s.GetAll(_token));
        Assert.That(result, Is.SameAs(Empty));
    }

    [Test]
    public async Task GetDivisionData_GivenNoSeasonIdFilterWhenTwoActiveSeasons_UsesSeasonWithGreatestEndDate()
    {
        var secondSeason = new SeasonDtoBuilder()
            .WithDates(new DateTime(2001, 01, 01), new DateTime(2001, 06, 01))
            .Build();
        var thirdSeason = new SeasonDtoBuilder()
            .WithDates(new DateTime(2001, 04, 01), new DateTime(2001, 07, 01))
            .Build();
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(Season, secondSeason, thirdSeason));

        await _service.GetDivisionData(Division1Filter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.Season, Is.EqualTo(secondSeason));
    }

    [Test]
    public async Task GetDivisionData_GivenDivisionIdFilter_ProducesTeamLookupToAnyDivision()
    {
        _allTeams.AddRange(new[] { Division1Team, Division2Team });

        await _service.GetDivisionData(Division1Filter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.TeamIdToDivisionIdLookup.Keys, Is.EquivalentTo(new[]
        {
            Division1Team.Id, Division2Team.Id,
        }));
        Assert.That(_divisionDataContext!.TeamIdToDivisionIdLookup.Values, Is.EquivalentTo(new[]
        {
            Division1.Id, Division2.Id,
        }));
    }

    [Test]
    public async Task GetDivisionData_GivenDivisionIdFilter_IncludesMatchingTeamsOnly()
    {
        _allTeams.AddRange(new[] { Division1Team, Division2Team });

        await _service.GetDivisionData(Division1Filter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.TeamsInSeasonAndDivision, Is.EquivalentTo(new[] { Division1Team }));
    }

    [Test]
    public async Task GetDivisionData_GivenNoDivisionIdFilter_IncludesAllTeams()
    {
        _allTeams.AddRange(new[] { Division1Team, Division2Team });

        await _service.GetDivisionData(SeasonIdFilter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), It.IsAny<IReadOnlyCollection<DivisionDto?>>(), true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.TeamsInSeasonAndDivision, Is.EquivalentTo(_allTeams));
    }

    [Test]
    public async Task GetDivisionData_GivenNoDivisionIdFilterAndDeletedTeamSeasons_IncludesAllActiveTeams()
    {
        var teamDeletedFromSeason = new TeamDtoBuilder()
            .WithSeason(s => s.ForSeason(Season, Division1).Deleted())
            .Build();
        _allTeams.AddRange(new[] { Division1Team, teamDeletedFromSeason });

        await _service.GetDivisionData(SeasonIdFilter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), It.IsAny<IReadOnlyCollection<DivisionDto?>>(), true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.TeamsInSeasonAndDivision, Is.EquivalentTo(new[] { Division1Team }));
    }

    [Test]
    public async Task GetDivisionData_GivenDivisionIdFilter_IncludesMatchingNotesOnly()
    {
        var note = new FixtureDateNoteDto
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
        };
        var otherDivisionNote = new FixtureDateNoteDto
        {
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
        };
        var allDivisionsNote = new FixtureDateNoteDto
        {
            Id = Guid.NewGuid(),
            DivisionId = null,
        };
        _someNotes.AddRange(new[] { note, otherDivisionNote, allDivisionsNote });

        await _service.GetDivisionData(Division1Filter, _token);

        _noteService.Verify(s => s.GetWhere($"t.SeasonId = '{Season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.Notes.Values.SelectMany(n => n), Is.EquivalentTo(new[] { note, allDivisionsNote }));
    }

    [Test]
    public async Task GetDivisionData_GivenNoDivisionIdFilter_IncludesAllNotes()
    {
        var note = new FixtureDateNoteDto
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
        };
        var otherDivisionNote = new FixtureDateNoteDto
        {
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
        };
        var allDivisionsNote = new FixtureDateNoteDto
        {
            Id = Guid.NewGuid(),
            DivisionId = null,
        };
        _someNotes.AddRange(new[] { note, otherDivisionNote, allDivisionsNote });

        await _service.GetDivisionData(SeasonIdFilter, _token);

        _noteService.Verify(s => s.GetWhere($"t.SeasonId = '{Season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), It.IsAny<IReadOnlyCollection<DivisionDto?>>(), true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.Notes.Values.SelectMany(n => n), Is.EquivalentTo(_someNotes));
    }

    [Test]
    public async Task GetDivisionData_GivenDivisionIdFilter_IncludesMatchingGamesWithinSeason()
    {
        _someGames.AddRange(new[] { Division1GameInSeason, Division1GameOutOfSeason });

        await _service.GetDivisionData(Division1Filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.DivisionId in ('{Division1.Id}') or t.IsKnockout = true", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[] { Division1GameInSeason }));
    }

    [Test]
    public async Task GetDivisionData_GivenMultipleDivisionIdFilter_IncludesMatchingGamesWithinSeason()
    {
        var filter = new DivisionDataFilter
        {
            DivisionId = { Division1.Id, Division2.Id },
        };
        _someGames.AddRange(new[] { Division1GameInSeason, Division1GameOutOfSeason, Division2GameInSeason });

        await _service.GetDivisionData(filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.DivisionId in ('{Division1.Id}', '{Division2.Id}') or t.IsKnockout = true", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1, Division2 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[] { Division1GameInSeason, Division2GameInSeason }));
    }

    [Test]
    public async Task GetDivisionData_GivenNoDivisionIdFilter_IncludesAllGamesWithinSeason()
    {
        _someGames.AddRange(new[] { Division1GameInSeason, Division1GameOutOfSeason, Division2GameInSeason, Division2GameOutOfSeason });

        await _service.GetDivisionData(SeasonIdFilter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.SeasonId = '{Season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), It.IsAny<IReadOnlyCollection<DivisionDto?>>(), true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[] { Division1GameInSeason, Division2GameInSeason }));
    }

    [Test]
    public async Task GetDivisionData_WhenIgnoringDates_ReturnsFixturesBeforeAndAfterSeasonDates()
    {
        var filter = new DivisionDataFilter
        {
            SeasonId = Season.Id,
            IgnoreDates = true,
        };
        var givenDivisionGameBeforeStartOfSeason = new GameBuilder()
            .ForDivision(Division1)
            .WithDate(new DateTime(2000, 12, 31))
            .Build();
        var otherDivisionGameBeforeStartOfSeason = new GameBuilder()
            .ForDivision(Division2)
            .WithDate(new DateTime(2000, 12, 31))
            .Build();
        _someGames.AddRange(new[]
        {
            givenDivisionGameBeforeStartOfSeason,
            Division1GameOutOfSeason,
            otherDivisionGameBeforeStartOfSeason,
            Division2GameOutOfSeason,
        });

        await _service.GetDivisionData(filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.SeasonId = '{Season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), It.IsAny<IReadOnlyCollection<DivisionDto?>>(), true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[]
        {
            givenDivisionGameBeforeStartOfSeason, Division1GameOutOfSeason,
            otherDivisionGameBeforeStartOfSeason, Division2GameOutOfSeason,
        }));
    }

    [Test]
    public async Task GetDivisionData_GivenDivisionIdFilter_IncludesMatchingTournamentsWithinSeason()
    {
        var inSeasonTournament = new TournamentGameBuilder()
            .WithDate(new DateTime(2001, 02, 01))
            .Build();
        var outOfSeasonTournament = new TournamentGameBuilder()
            .WithDate(new DateTime(2001, 06, 01))
            .Build();
        _someTournaments.AddRange(new[] { inSeasonTournament, outOfSeasonTournament });

        await _service.GetDivisionData(Division1Filter, _token);

        _tournamentGameRepository.Verify(s => s.GetSome($"t.SeasonId = '{Season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllTournamentGames(new[] { Division1.Id }), Is.EquivalentTo(new[] { inSeasonTournament }));
    }

    [Test]
    public async Task GetDivisionData_GivenMultiDivisionIdFilter_IncludesMatchingTournamentsWithinSeason()
    {
        var filter = new DivisionDataFilter
        {
            DivisionId = { Division1.Id, Division2.Id },
        };
        var division1InSeasonTournament = new TournamentGameBuilder()
            .WithDate(new DateTime(2001, 02, 01))
            .WithDivision(Division1)
            .Build();
        var division2InSeasonTournament = new TournamentGameBuilder()
            .WithDate(new DateTime(2001, 02, 01))
            .WithDivision(Division2)
            .Build();
        var outOfSeasonTournament = new TournamentGameBuilder()
            .WithDate(new DateTime(2001, 06, 01))
            .Build();
        _someTournaments.AddRange(new[] { division1InSeasonTournament, outOfSeasonTournament, division2InSeasonTournament });

        await _service.GetDivisionData(filter, _token);

        _tournamentGameRepository.Verify(s => s.GetSome($"t.SeasonId = '{Season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1, Division2 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllTournamentGames(new[] { Division1.Id }), Is.EquivalentTo(new[]
        {
            division1InSeasonTournament,
        }));
        Assert.That(_divisionDataContext!.AllTournamentGames(new[] { Division2.Id }), Is.EquivalentTo(new[]
        {
            division2InSeasonTournament,
        }));
    }

    [Test]
    public async Task GetDivisionData_WhenLoggedInAndCannotManageGames_GetsFixturesForFilterDivisionOnly()
    {
        _someGames.AddRange(new[] { Division1GameInSeason, Division1GameOutOfSeason });
        WithAccess(manageGames: false);

        await _service.GetDivisionData(Division1AndSeason1Filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.DivisionId in ('{Division1.Id}') or t.IsKnockout = true", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[] { Division1GameInSeason }));
    }

    [Test]
    public async Task GetDivisionData_WhenLoggedInAndCanManageGames_GetsFixturesForAllDivisions()
    {
        _someGames.AddRange(new[] { Division1GameInSeason, Division1GameOutOfSeason, Division2GameInSeason, Division2GameOutOfSeason });
        WithAccess(manageGames: true);

        await _service.GetDivisionData(Division1AndSeason1Filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.SeasonId = '{Season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[] { Division1GameInSeason, Division2GameInSeason }));
    }

    [Test]
    public async Task GetDivisionData_WhenExcludingProposals_RequestsDivisionDataWithoutProposals()
    {
        var filter = new DivisionDataFilter
        {
            SeasonId = Season.Id,
            DivisionId = { Division1.Id },
            ExcludeProposals = true,
        };
        WithAccess(manageGames: true);

        await _service.GetDivisionData(filter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, false, _token));
    }

    private void WithAccess(bool manageGames)
    {
        _userDto = new UserDto
        {
            Access = new AccessDto
            {
                ManageGames = manageGames,
            },
        };
    }
}