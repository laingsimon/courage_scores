using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;
using CourageScores.Services.Division;
using CourageScores.Services.Health;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using CourageScores.Services.Season.Creation;
using CourageScores.Services.Season.Creation.CompatibilityCheck;
using CourageScores.Services.Team;
using CourageScores.Tests.Models.Adapters;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation;

[TestFixture]
public class SeasonTemplateServiceTests
{
    private readonly CancellationToken _token = new();
    private SeasonTemplateService _service = null!;
    private Mock<IGenericDataService<Template, TemplateDto>> _underlyingService = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<ICachingSeasonService> _seasonService = null!;
    private Mock<ICachingDivisionService> _divisionService = null!;
    private Mock<ICompatibilityCheckFactory> _checkFactory = null!;
    private Mock<ICompatibilityCheck> _check = null!;
    private Mock<ISeasonProposalStrategy> _proposalStrategy = null!;
    private Mock<ICachingTeamService> _teamService = null!;
    private UserDto? _user;
    private TemplateDto[] _templates = null!;
    private SeasonDto _season = null!;
    private DivisionDataDto? _division;
    private TeamDto[] _teamsInSeason = null!;
    private MockAdapter<Template, TemplateDto> _templateAdapter = null!;
    private Mock<IHealthCheckService> _healthCheckService = null!;
    private Mock<ISimpleOnewayAdapter<Template,SeasonHealthDto>> _healthCheckAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _underlyingService = new Mock<IGenericDataService<Template, TemplateDto>>();
        _userService = new Mock<IUserService>();
        _seasonService = new Mock<ICachingSeasonService>();
        _divisionService = new Mock<ICachingDivisionService>();
        _checkFactory = new Mock<ICompatibilityCheckFactory>();
        _check = new Mock<ICompatibilityCheck>();
        _proposalStrategy = new Mock<ISeasonProposalStrategy>();
        _teamService = new Mock<ICachingTeamService>();
        _healthCheckAdapter = new Mock<ISimpleOnewayAdapter<Template, SeasonHealthDto>>();
        _healthCheckService = new Mock<IHealthCheckService>();
        _templateAdapter = new MockAdapter<Template, TemplateDto>();
        _service = new SeasonTemplateService(
            _underlyingService.Object,
            _userService.Object,
            _seasonService.Object,
            _divisionService.Object,
            _checkFactory.Object,
            _proposalStrategy.Object,
            _teamService.Object,
            _healthCheckAdapter.Object,
            _healthCheckService.Object,
            _templateAdapter);
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageGames = true,
            },
        };
        _templates = Array.Empty<TemplateDto>();
        var divisionId = Guid.NewGuid();
        _season = new SeasonDto
        {
            Id = Guid.NewGuid(),
            Divisions =
            {
                new DivisionDto
                {
                    Id = divisionId,
                },
            },
        };
        _division = new DivisionDataDto
        {
            Id = divisionId,
            Name = "Division One",
            Season = new DivisionDataSeasonDto
            {
                Id = _season.Id,
            },
        };
        _teamsInSeason = Array.Empty<TeamDto>();

        _underlyingService.Setup(s => s.GetAll(_token)).Returns(() => TestUtilities.AsyncEnumerable(_templates));
        _underlyingService
            .Setup(s => s.Get(It.IsAny<Guid>(), _token))
            .ReturnsAsync((Guid id, CancellationToken _) => _templates.SingleOrDefault(t => t.Id == id));
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);
        _divisionService
            .Setup(s => s.GetDivisionData(
                It.Is<DivisionDataFilter>(f => f.DivisionId.Contains(_division.Id) && f.SeasonId == _season.Id), _token))
            .ReturnsAsync(() => _division);
        _checkFactory.Setup(f => f.CreateChecks()).Returns(_check.Object);
        _teamService.Setup(s => s.GetTeamsForSeason(_season.Id, _token))
            .Returns(() => TestUtilities.AsyncEnumerable(_teamsInSeason));
    }

    [Test]
    public async Task GetForSeason_WhenLoggedOut_ReturnsNotLoggedIn()
    {
        _user = null;

        var result = await _service.GetForSeason(_season.Id, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[]
        {
            "Not logged in",
        }));
    }

    [Test]
    public async Task GetForSeason_WhenNotPermitted_ReturnsNotPermitted()
    {
        _user!.Access!.ManageGames = false;
        _user!.Access!.ManageSeasonTemplates = false;

        var result = await _service.GetForSeason(_season.Id, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[]
        {
            "Not permitted",
        }));
    }

    [Test]
    public async Task GetForSeason_WhenSeasonNotFound_ReturnsSeasonNotFound()
    {
        var result = await _service.GetForSeason(Guid.NewGuid(), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[]
        {
            "Season not found",
        }));
    }

    [TestCase(true, true)]
    [TestCase(true, false)]
    [TestCase(false, true)]
    public async Task GetForSeason_WhenPermitted_ReturnsEmptyList(bool manageGames, bool manageTemplates)
    {
        _user!.Access!.ManageGames = manageGames;
        _user!.Access!.ManageSeasonTemplates = manageTemplates;
        _templates = Array.Empty<TemplateDto>();

        var result = await _service.GetForSeason(_season.Id, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task GetForSeason_GivenDivisions_GetsDivisionData()
    {
        var result = await _service.GetForSeason(_season.Id, _token);

        _divisionService
            .Verify(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.DivisionId.Contains(_division!.Id) && f.SeasonId == _season.Id && f.ExcludeProposals == true), _token));
        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task GetForSeason_GivenDivisions_GetsTeamsForSeason()
    {
        await _service.GetForSeason(_season.Id, _token);

        _teamService.Verify(s => s.GetTeamsForSeason(_season.Id, _token));
    }

    [Test]
    public async Task GetForSeason_GivenTeams_ResolvesTeamsInSeasonToPerDivisionDictionary()
    {
        var division1 = Guid.NewGuid();
        var division2 = Guid.NewGuid();
        var template = new TemplateDto();
        _templates = new[]
        {
            template,
        };
        var division1Team1 = new TeamDto
        {
            Seasons =
            {
                new TeamSeasonDto
                {
                    DivisionId = division1,
                    SeasonId = _season.Id,
                },
            },
        };
        var division1Team2 = new TeamDto
        {
            Seasons =
            {
                new TeamSeasonDto
                {
                    DivisionId = division1,
                    SeasonId = _season.Id,
                },
            },
        };
        var division2Team1 = new TeamDto
        {
            Seasons =
            {
                new TeamSeasonDto
                {
                    DivisionId = division2,
                    SeasonId = _season.Id,
                },
            },
        };
        _teamsInSeason = new[]
        {
            division1Team1,
            division1Team2,
            division2Team1,
        };
        var expected = new Dictionary<Guid, TeamDto[]>
        {
            {
                division1, new[]
                {
                    division1Team1, division1Team2,
                }
            },
            {
                division2, new[]
                {
                    division2Team1,
                }
            },
        };
        _check
            .Setup(c => c.Check(template, It.IsAny<TemplateMatchContext>(), _token))
            .ReturnsAsync(new ActionResultDto<TemplateDto>
            {
                Success = true,
            });

        await _service.GetForSeason(_season.Id, _token);

        _check.Verify(c => c.Check(template, It.Is<TemplateMatchContext>(context => TeamsAreCorrectlyMapped(context, expected)), _token));
    }

    [Test]
    public async Task GetForSeason_GivenDeletedSeasonTeams_ResolvesTeamsInSeasonToPerDivisionDictionary()
    {
        var division1 = Guid.NewGuid();
        var division2 = Guid.NewGuid();
        var template = new TemplateDto();
        _templates = new[]
        {
            template,
        };
        var division1Team1 = new TeamDto
        {
            Seasons =
            {
                new TeamSeasonDto
                {
                    DivisionId = division1,
                    SeasonId = _season.Id,
                    Deleted = DateTime.UtcNow,
                },
            },
        };
        var division1Team2 = new TeamDto
        {
            Seasons =
            {
                new TeamSeasonDto
                {
                    DivisionId = division1,
                    SeasonId = _season.Id,
                    Deleted = DateTime.UtcNow,
                },
            },
        };
        var division2Team1 = new TeamDto
        {
            Seasons =
            {
                new TeamSeasonDto
                {
                    DivisionId = division2,
                    SeasonId = _season.Id,
                    Deleted = DateTime.UtcNow,
                },
            },
        };
        _teamsInSeason = new[]
        {
            division1Team1,
            division1Team2,
            division2Team1,
        };
        var expected = new Dictionary<Guid, TeamDto[]>();
        _check
            .Setup(c => c.Check(template, It.IsAny<TemplateMatchContext>(), _token))
            .ReturnsAsync(new ActionResultDto<TemplateDto>
            {
                Success = true,
            });

        await _service.GetForSeason(_season.Id, _token);

        _check.Verify(c => c.Check(template, It.Is<TemplateMatchContext>(context => TeamsAreCorrectlyMapped(context, expected)), _token));
    }

    [Test]
    public async Task GetForSeason_GivenTemplateIncompatible_ReturnsIncompatible()
    {
        var template = new TemplateDto();
        _templates = new[]
        {
            template,
        };
        _check
            .Setup(c => c.Check(template, It.IsAny<TemplateMatchContext>(), _token))
            .ReturnsAsync(new ActionResultDto<TemplateDto>
            {
                Success = false,
            });

        var result = await _service.GetForSeason(_season.Id, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.Select(r => r.Result), Has.All.Not.Null);
        Assert.That(result.Result!.Select(r => r.Success), Has.All.False);
    }

    [Test]
    public async Task GetForSeason_GivenTemplateCompatible_ReturnsCompatible()
    {
        var template = new TemplateDto();
        _templates = new[]
        {
            template,
        };
        _check
            .Setup(c => c.Check(template, It.IsAny<TemplateMatchContext>(), _token))
            .ReturnsAsync(new ActionResultDto<TemplateDto>
            {
                Success = true,
            });

        var result = await _service.GetForSeason(_season.Id, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.Select(r => r.Result), Has.All.Not.Null);
        Assert.That(result.Result!.Select(r => r.Success), Has.All.True);
    }

    [Test]
    public async Task ProposeForSeason_WhenLoggedOut_ReturnsNotLoggedIn()
    {
        _user = null;
        var template = new TemplateDto
        {
            Id = Guid.NewGuid(),
        };
        _templates = new[]
        {
            template,
        };
        var request = new ProposalRequestDto
        {
            SeasonId = _season.Id,
            TemplateId = template.Id,
        };

        var result = await _service.ProposeForSeason(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[]
        {
            "Not logged in",
        }));
    }

    [Test]
    public async Task ProposeForSeason_WhenNotPermitted_ReturnsNotPermitted()
    {
        _user!.Access!.ManageGames = false;
        var template = new TemplateDto
        {
            Id = Guid.NewGuid(),
        };
        _templates = new[]
        {
            template,
        };
        var request = new ProposalRequestDto
        {
            SeasonId = _season.Id,
            TemplateId = template.Id,
        };

        var result = await _service.ProposeForSeason(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[]
        {
            "Not permitted",
        }));
    }

    [Test]
    public async Task ProposeForSeason_WhenSeasonNotFound_ReturnsSeasonNotFound()
    {
        var template = new TemplateDto
        {
            Id = Guid.NewGuid(),
        };
        _templates = new[]
        {
            template,
        };
        var request = new ProposalRequestDto
        {
            SeasonId = Guid.NewGuid(),
            TemplateId = template.Id,
        };

        var result = await _service.ProposeForSeason(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[]
        {
            "Season not found",
        }));
    }

    [Test]
    public async Task ProposeForSeason_WhenTemplateNotFound_ReturnsTemplateNotFound()
    {
        var template = new TemplateDto
        {
            Id = Guid.NewGuid(),
        };
        _templates = new[]
        {
            template,
        };
        var request = new ProposalRequestDto
        {
            SeasonId = _season.Id,
            TemplateId = Guid.NewGuid(),
        };

        var result = await _service.ProposeForSeason(request, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[]
        {
            "Template not found",
        }));
    }

    [Test]
    public async Task ProposeForSeason_WhenPermitted_ProposesFixturesForAllDivisions()
    {
        var template = new TemplateDto
        {
            Id = Guid.NewGuid(),
        };
        _templates = new[]
        {
            template,
        };
        var request = new ProposalRequestDto
        {
            SeasonId = _season.Id,
            TemplateId = template.Id,
        };
        var proposalResult = new ActionResultDto<ProposalResultDto>();
        _proposalStrategy
            .Setup(s => s.ProposeFixtures(It.IsAny<TemplateMatchContext>(), template, _token))
            .ReturnsAsync(proposalResult);

        var result = await _service.ProposeForSeason(request, _token);

        Assert.That(result, Is.SameAs(proposalResult));
    }

    [Test]
    public async Task ProposeForSeason_GivenTeams_ResolvesTeamsInSeasonToPerDivisionDictionary()
    {
        var division1 = Guid.NewGuid();
        var division2 = Guid.NewGuid();
        var template = new TemplateDto();
        _templates = new[]
        {
            template,
        };
        var division1Team1 = new TeamDto
        {
            Seasons =
            {
                new TeamSeasonDto
                {
                    DivisionId = division1,
                    SeasonId = _season.Id,
                },
            },
        };
        var division1Team2 = new TeamDto
        {
            Seasons =
            {
                new TeamSeasonDto
                {
                    DivisionId = division1,
                    SeasonId = _season.Id,
                },
            },
        };
        var division2Team1 = new TeamDto
        {
            Seasons =
            {
                new TeamSeasonDto
                {
                    DivisionId = division2,
                    SeasonId = _season.Id,
                },
            },
        };
        _teamsInSeason = new[]
        {
            division1Team1,
            division1Team2,
            division2Team1,
        };
        var expected = new Dictionary<Guid, TeamDto[]>
        {
            {
                division1, new[]
                {
                    division1Team1, division1Team2,
                }
            },
            {
                division2, new[]
                {
                    division2Team1,
                }
            },
        };
        var request = new ProposalRequestDto
        {
            SeasonId = _season.Id,
            TemplateId = template.Id,
        };

        await _service.ProposeForSeason(request, _token);

        _proposalStrategy.Verify(s => s.ProposeFixtures(It.Is<TemplateMatchContext>(context => TeamsAreCorrectlyMapped(context, expected)), template, _token));
    }

    [Test]
    public async Task ProposeForSeason_GivenDeletedSeasonTeams_ResolvesTeamsInSeasonToPerDivisionDictionary()
    {
        var division1 = Guid.NewGuid();
        var division2 = Guid.NewGuid();
        var template = new TemplateDto();
        _templates = new[]
        {
            template,
        };
        var division1Team1 = new TeamDto
        {
            Seasons =
            {
                new TeamSeasonDto
                {
                    DivisionId = division1,
                    SeasonId = _season.Id,
                    Deleted = DateTime.UtcNow,
                },
            },
        };
        var division1Team2 = new TeamDto
        {
            Seasons =
            {
                new TeamSeasonDto
                {
                    DivisionId = division1,
                    SeasonId = _season.Id,
                    Deleted = DateTime.UtcNow,
                },
            },
        };
        var division2Team1 = new TeamDto
        {
            Seasons =
            {
                new TeamSeasonDto
                {
                    DivisionId = division2,
                    SeasonId = _season.Id,
                    Deleted = DateTime.UtcNow,
                },
            },
        };
        _teamsInSeason = new[]
        {
            division1Team1,
            division1Team2,
            division2Team1,
        };
        var expected = new Dictionary<Guid, TeamDto[]>();
        var request = new ProposalRequestDto
        {
            SeasonId = _season.Id,
            TemplateId = template.Id,
        };

        await _service.ProposeForSeason(request, _token);

        _proposalStrategy.Verify(s => s.ProposeFixtures(It.Is<TemplateMatchContext>(context => TeamsAreCorrectlyMapped(context, expected)), template, _token));
    }

    [Test]
    public async Task GetTemplateHealth_WhenLoggedOut_ReturnsNotLoggedIn()
    {
        _user = null;
        var template = new EditTemplateDto();

        var result = await _service.GetTemplateHealth(template, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[]
        {
            "Not logged in",
        }));
    }

    [Test]
    public async Task GetTemplateHealth_WhenNotPermitted_ReturnsNotLoggedIn()
    {
        _user!.Access!.ManageSeasonTemplates = false;
        var template = new EditTemplateDto();

        var result = await _service.GetTemplateHealth(template, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(new[]
        {
            "Not permitted",
        }));
    }

    [Test]
    public async Task GetTemplateHealth_WhenPermitted_ReturnsTemplateHealth()
    {
        _user!.Access!.ManageSeasonTemplates = true;
        var editTemplateDto = new EditTemplateDto();
        var templateHealth = new SeasonHealthCheckResultDto();
        var seasonHealth = new SeasonHealthDto();
        var template = new Template();
        _templateAdapter.AddMapping(template, editTemplateDto);
        _healthCheckAdapter.Setup(a => a.Adapt(template, _token)).ReturnsAsync(seasonHealth);
        _healthCheckService.Setup(s => s.Check(seasonHealth, _token)).ReturnsAsync(templateHealth);

        var result = await _service.GetTemplateHealth(editTemplateDto, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.EqualTo(templateHealth));
    }

    private static bool TeamsAreCorrectlyMapped(TemplateMatchContext context, Dictionary<Guid, TeamDto[]> expected)
    {
        Assert.That(context.Teams.Keys, Is.EquivalentTo(expected.Keys));

        foreach (var expectedMapping in expected)
        {
            var actualTeams = context.Teams[expectedMapping.Key];
            Assert.That(actualTeams, Is.EquivalentTo(expectedMapping.Value));
        }

        return true;
    }
}