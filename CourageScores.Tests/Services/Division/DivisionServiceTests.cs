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
using CosmosSeason = CourageScores.Models.Cosmos.Season.Season;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionServiceTests
{
    private static readonly DivisionDto Division1 = new DivisionDto
    {
        Id = Guid.NewGuid(),
        Name = "DIVISION 1",
    };
    private static readonly DivisionDto Division2 = new DivisionDto
    {
        Id = Guid.NewGuid(),
        Name = "DIVISION 2",
    };
    private static readonly DivisionDataFilter Division1Filter = new DivisionDataFilter
    {
        DivisionId = { Division1.Id },
    };
    private static readonly SeasonDto Season = new SeasonDto
    {
        Id = Guid.NewGuid(),
        StartDate = new DateTime(2001, 01, 01),
        EndDate = new DateTime(2001, 05, 01),
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
        var insufficientData = new DivisionDataDto();
        var filter = new DivisionDataFilter();
        _divisionDataDtoFactory.Setup(f => f.DivisionIdAndSeasonIdNotSupplied(It.IsAny<Guid?>())).Returns(insufficientData);

        var result = await _service.GetDivisionData(filter, _token);

        Assert.That(result, Is.SameAs(insufficientData));
    }

    [Test]
    public async Task GetDivisionData_GivenDivisionIdFilterWhenDivisionNotFound_ReturnsDivisionNotFound()
    {
        var notFound = new DivisionDataDto();
        _divisionDataDtoFactory.Setup(f => f.DivisionNotFound(new[] { Division1.Id }, It.IsAny<IReadOnlyCollection<DivisionDto>>())).Returns(notFound);
        _genericService.Setup(s => s.Get(Division1.Id, _token)).ReturnsAsync(() => null);

        var result = await _service.GetDivisionData(Division1Filter, _token);

        Assert.That(result, Is.SameAs(notFound));
    }

    [Test]
    public async Task GetDivisionData_GivenDivisionIdFilterWhenDivisionDeleted_ReturnsDivisionNotFound()
    {
        var notFound = new DivisionDataDto();
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Deleted = new DateTime(2001, 02, 03),
        };
        var filter = new DivisionDataFilter
        {
            DivisionId = { division.Id },
        };
        _divisionDataDtoFactory.Setup(f => f.DivisionNotFound(
            filter.DivisionId,
            It.Is<IReadOnlyCollection<DivisionDto>>(divs => divs.Select(d => d.Id).SequenceEqual(new[] { division.Id })))).Returns(notFound);
        _genericService.Setup(s => s.Get(division.Id, _token)).ReturnsAsync(division);

        var result = await _service.GetDivisionData(filter, _token);

        Assert.That(result, Is.SameAs(notFound));
    }

    [Test]
    public async Task GetDivisionData_GivenSeasonIdFilterWhenSeasonNotFound_ReturnsSeasonNotFound()
    {
        var seasonNotFound = new DivisionDataDto();
        var filter = new DivisionDataFilter
        {
            DivisionId = { Division1.Id },
            SeasonId = Guid.NewGuid(),
        };
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(new[] { Division1 }, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(seasonNotFound);

        var result = await _service.GetDivisionData(filter, _token);

        _genericSeasonService.Verify(s => s.GetAll(_token));
        Assert.That(result, Is.SameAs(seasonNotFound));
    }

    [Test]
    public async Task GetDivisionData_GivenNoSeasonIdFilterAndNoSeasons_ReturnsSeasonNotFound()
    {
        var seasonNotFound = new DivisionDataDto();
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(new[] { Division1 }, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(seasonNotFound);
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<SeasonDto>());

        var result = await _service.GetDivisionData(Division1Filter, _token);

        _genericSeasonService.Verify(s => s.GetAll(_token));
        Assert.That(result, Is.SameAs(seasonNotFound));
    }

    [Test]
    public async Task GetDivisionData_GivenNoSeasonIdFilterWhenNoActiveSeasons_ReturnsSeasonNotFound()
    {
        var seasonNotFound = new DivisionDataDto();
        _divisionDataDtoFactory.Setup(f => f.SeasonNotFound(new[] { Division1 }, It.IsAny<List<SeasonDto>>(), _token)).ReturnsAsync(seasonNotFound);
        _now = new DateTimeOffset(2001, 06, 01, 0, 0, 0, TimeSpan.Zero);

        var result = await _service.GetDivisionData(Division1Filter, _token);

        _genericSeasonService.Verify(s => s.GetAll(_token));
        Assert.That(result, Is.SameAs(seasonNotFound));
    }

    [Test]
    public async Task GetDivisionData_GivenNoSeasonIdFilterWhenTwoActiveSeasons_UsesSeasonWithGreatestEndDate()
    {
        var secondSeason = new SeasonDto
        {
            Id = Guid.NewGuid(),
            StartDate = new DateTime(2001, 01, 01),
            EndDate = new DateTime(2001, 06, 01),
        };
        var thirdSeason = new SeasonDto
        {
            Id = Guid.NewGuid(),
            StartDate = new DateTime(2001, 04, 01),
            EndDate = new DateTime(2001, 07, 01),
        };
        _genericSeasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(Season, secondSeason, thirdSeason));

        await _service.GetDivisionData(Division1Filter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.Season, Is.EqualTo(secondSeason));
    }

    [Test]
    public async Task GetDivisionData_GivenDivisionIdFilter_ProducesTeamLookupToAnyDivision()
    {
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = Season.Id,
                    DivisionId = Division1.Id,
                },
            },
        };
        var otherDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = Season.Id,
                    DivisionId = Division2.Id,
                },
            },
        };
        _allTeams.AddRange(new[]
        {
            team, otherDivisionTeam,
        });

        await _service.GetDivisionData(Division1Filter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.TeamIdToDivisionIdLookup.Keys, Is.EquivalentTo(new[]
        {
            team.Id, otherDivisionTeam.Id,
        }));
        Assert.That(_divisionDataContext!.TeamIdToDivisionIdLookup.Values, Is.EquivalentTo(new[]
        {
            Division1.Id, Division2.Id,
        }));
    }

    [Test]
    public async Task GetDivisionData_GivenDivisionIdFilter_IncludesMatchingTeamsOnly()
    {
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = Season.Id,
                    DivisionId = Division1.Id,
                },
            },
        };
        var otherDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = Season.Id,
                    DivisionId = Guid.NewGuid(),
                },
            },
        };
        _allTeams.AddRange(new[]
        {
            team, otherDivisionTeam,
        });

        await _service.GetDivisionData(Division1Filter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.TeamsInSeasonAndDivision, Is.EquivalentTo(new[]
        {
            team,
        }));
    }

    [Test]
    public async Task GetDivisionData_GivenNoDivisionIdFilter_IncludesAllTeams()
    {
        var filter = new DivisionDataFilter
        {
            SeasonId = Season.Id,
        };
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = Season.Id,
                    DivisionId = Division1.Id,
                },
            },
        };
        var otherDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = Season.Id,
                    DivisionId = Division1.Id,
                },
            },
        };
        _allTeams.AddRange(new[]
        {
            team, otherDivisionTeam,
        });

        await _service.GetDivisionData(filter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), It.IsAny<IReadOnlyCollection<DivisionDto?>>(), true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.TeamsInSeasonAndDivision, Is.EquivalentTo(_allTeams));
    }

    [Test]
    public async Task GetDivisionData_GivenNoDivisionIdFilterAndDeletedTeamSeasons_IncludesAllActiveTeams()
    {
        var filter = new DivisionDataFilter
        {
            SeasonId = Season.Id,
        };
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = Season.Id,
                    DivisionId = Division1.Id,
                },
            },
        };
        var otherDivisionTeam = new TeamDto
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeasonDto
                {
                    SeasonId = Season.Id,
                    DivisionId = Division1.Id,
                    Deleted = DateTime.UtcNow,
                },
            },
        };
        _allTeams.AddRange(new[]
        {
            team, otherDivisionTeam,
        });

        await _service.GetDivisionData(filter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), It.IsAny<IReadOnlyCollection<DivisionDto?>>(), true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.TeamsInSeasonAndDivision, Is.EquivalentTo(new[] { team }));
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
        _someNotes.AddRange(new[]
        {
            note,
            otherDivisionNote,
            allDivisionsNote,
        });

        await _service.GetDivisionData(Division1Filter, _token);

        _noteService.Verify(s => s.GetWhere($"t.SeasonId = '{Season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.Notes.Values.SelectMany(n => n), Is.EquivalentTo(new[]
        {
            note, allDivisionsNote,
        }));
    }

    [Test]
    public async Task GetDivisionData_GivenNoDivisionIdFilter_IncludesAllNotes()
    {
        var filter = new DivisionDataFilter
        {
            SeasonId = Season.Id,
        };
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
        _someNotes.AddRange(new[]
        {
            note,
            otherDivisionNote,
            allDivisionsNote,
        });

        await _service.GetDivisionData(filter, _token);

        _noteService.Verify(s => s.GetWhere($"t.SeasonId = '{Season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), It.IsAny<IReadOnlyCollection<DivisionDto?>>(), true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.Notes.Values.SelectMany(n => n), Is.EquivalentTo(_someNotes));
    }

    [Test]
    public async Task GetDivisionData_GivenDivisionIdFilter_IncludesMatchingGamesWithinSeason()
    {
        var givenDivisionGameInSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
            Date = new DateTime(2001, 02, 01),
        };
        var givenDivisionGameOutOfSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
            Date = new DateTime(2001, 06, 01),
        };
        _someGames.AddRange(new[]
        {
            givenDivisionGameInSeason, givenDivisionGameOutOfSeason,
        });

        await _service.GetDivisionData(Division1Filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.DivisionId in ('{Division1.Id}') or t.IsKnockout = true", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[]
        {
            givenDivisionGameInSeason,
        }));
    }

    [Test]
    public async Task GetDivisionData_GivenMultipleDivisionIdFilter_IncludesMatchingGamesWithinSeason()
    {
        var filter = new DivisionDataFilter
        {
            DivisionId = { Division1.Id, Division2.Id },
        };
        var division1GameInSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
            Date = new DateTime(2001, 02, 01),
        };
        var division1GameOutOfSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
            Date = new DateTime(2001, 06, 01),
        };
        var division2GameInSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division2.Id,
            Date = new DateTime(2001, 02, 01),
        };
        _someGames.AddRange(new[]
        {
            division1GameInSeason, division1GameOutOfSeason, division2GameInSeason
        });

        await _service.GetDivisionData(filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.DivisionId in ('{Division1.Id}', '{Division2.Id}') or t.IsKnockout = true", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1, Division2 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[]
        {
            division1GameInSeason, division2GameInSeason
        }));
    }

    [Test]
    public async Task GetDivisionData_GivenNoDivisionIdFilter_IncludesAllGamesWithinSeason()
    {
        var filter = new DivisionDataFilter
        {
            SeasonId = Season.Id,
        };
        var givenDivisionGameInSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
            Date = new DateTime(2001, 02, 01),
        };
        var givenDivisionGameOutOfSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
            Date = new DateTime(2001, 06, 01),
        };
        var otherDivisionGameInSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 01),
        };
        var otherDivisionGameOutOfSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            Date = new DateTime(2001, 06, 01),
        };
        _someGames.AddRange(new[]
        {
            givenDivisionGameInSeason,
            givenDivisionGameOutOfSeason,
            otherDivisionGameInSeason,
            otherDivisionGameOutOfSeason,
        });

        await _service.GetDivisionData(filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.SeasonId = '{Season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), It.IsAny<IReadOnlyCollection<DivisionDto?>>(), true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[]
        {
            givenDivisionGameInSeason, otherDivisionGameInSeason,
        }));
    }

    [Test]
    public async Task GetDivisionData_WhenIgnoringDates_ReturnsFixturesBeforeAndAfterSeasonDates()
    {
        var filter = new DivisionDataFilter
        {
            SeasonId = Season.Id,
            IgnoreDates = true,
        };
        var givenDivisionGameBeforeStartOfSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
            Date = new DateTime(2000, 12, 31),
        };
        var givenDivisionGameAfterEndOfSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
            Date = new DateTime(2001, 06, 01),
        };
        var otherDivisionGameBeforeStartOfSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            Date = new DateTime(2000, 12, 31),
        };
        var otherDivisionGameAfterEndOfSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            Date = new DateTime(2001, 06, 01),
        };
        _someGames.AddRange(new[]
        {
            givenDivisionGameBeforeStartOfSeason,
            givenDivisionGameAfterEndOfSeason,
            otherDivisionGameBeforeStartOfSeason,
            otherDivisionGameAfterEndOfSeason,
        });

        await _service.GetDivisionData(filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.SeasonId = '{Season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), It.IsAny<IReadOnlyCollection<DivisionDto?>>(), true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[]
        {
            givenDivisionGameBeforeStartOfSeason, givenDivisionGameAfterEndOfSeason,
            otherDivisionGameBeforeStartOfSeason, otherDivisionGameAfterEndOfSeason,
        }));
    }

    [Test]
    public async Task GetDivisionData_GivenDivisionIdFilter_IncludesMatchingTournamentsWithinSeason()
    {
        var filter = new DivisionDataFilter
        {
            DivisionId = { Division1.Id },
        };
        var inSeasonTournament = new TournamentGame
        {
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 01),
        };
        var outOfSeasonTournament = new TournamentGame
        {
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 06, 01),
        };
        _someTournaments.AddRange(new[]
        {
            inSeasonTournament, outOfSeasonTournament,
        });

        await _service.GetDivisionData(filter, _token);

        _tournamentGameRepository.Verify(s => s.GetSome($"t.SeasonId = '{Season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllTournamentGames(new[] { Division1.Id }), Is.EquivalentTo(new[]
        {
            inSeasonTournament,
        }));
    }

    [Test]
    public async Task GetDivisionData_GivenMultiDivisionIdFilter_IncludesMatchingTournamentsWithinSeason()
    {
        var filter = new DivisionDataFilter
        {
            DivisionId = { Division1.Id, Division2.Id },
        };
        var division1InSeasonTournament = new TournamentGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
            Date = new DateTime(2001, 02, 01),
        };
        var division2InSeasonTournament = new TournamentGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division2.Id,
            Date = new DateTime(2001, 02, 01),
        };
        var outOfSeasonTournament = new TournamentGame
        {
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 06, 01),
        };
        _someTournaments.AddRange(new[]
        {
            division1InSeasonTournament, outOfSeasonTournament, division2InSeasonTournament,
        });

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
        var filter = new DivisionDataFilter
        {
            SeasonId = Season.Id,
            DivisionId = { Division1.Id },
        };
        var givenDivisionGameInSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
            Date = new DateTime(2001, 02, 01),
        };
        var givenDivisionGameOutOfSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
            Date = new DateTime(2001, 06, 01),
        };
        _someGames.AddRange(new[]
        {
            givenDivisionGameInSeason, givenDivisionGameOutOfSeason,
        });
        _userDto = new UserDto
        {
            Access = new AccessDto
            {
                ManageGames = false,
            },
        };

        await _service.GetDivisionData(filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.DivisionId in ('{Division1.Id}') or t.IsKnockout = true", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[]
        {
            givenDivisionGameInSeason,
        }));
    }

    [Test]
    public async Task GetDivisionData_WhenLoggedInAndCanManageGames_GetsFixturesForAllDivisions()
    {
        var filter = new DivisionDataFilter
        {
            SeasonId = Season.Id,
            DivisionId = { Division1.Id },
        };
        var givenDivisionGameInSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
            Date = new DateTime(2001, 02, 01),
        };
        var givenDivisionGameOutOfSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Division1.Id,
            Date = new DateTime(2001, 06, 01),
        };
        var otherDivisionGameInSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 01),
        };
        var otherDivisionGameOutOfSeason = new CosmosGame
        {
            Id = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            Date = new DateTime(2001, 06, 01),
        };
        _someGames.AddRange(new[]
        {
            givenDivisionGameInSeason,
            givenDivisionGameOutOfSeason,
            otherDivisionGameInSeason,
            otherDivisionGameOutOfSeason,
        });
        _userDto = new UserDto
        {
            Access = new AccessDto
            {
                ManageGames = true,
            },
        };

        await _service.GetDivisionData(filter, _token);

        _gameRepository.Verify(s => s.GetSome($"t.SeasonId = '{Season.Id}'", _token));
        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, true, _token));
        Assert.That(_divisionDataContext, Is.Not.Null);
        Assert.That(_divisionDataContext!.AllGames(null), Is.EquivalentTo(new[]
        {
            givenDivisionGameInSeason, otherDivisionGameInSeason,
        }));
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
        _userDto = new UserDto
        {
            Access = new AccessDto
            {
                ManageGames = true,
            },
        };

        await _service.GetDivisionData(filter, _token);

        _divisionDataDtoFactory.Verify(f => f.CreateDivisionDataDto(It.IsAny<DivisionDataContext>(), new[] { Division1 }, false, _token));
    }
}