using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Health;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services.Division;
using CourageScores.Services.Health;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Health;

[TestFixture]
public class HealthCheckServiceTests
{
    private readonly CancellationToken _token = new();
    private HealthCheckService _service = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<ICachingSeasonService> _seasonService = null!;
    private Mock<ICachingDivisionService> _divisionService = null!;
    private Mock<ISeasonHealthCheckFactory> _healthCheckFactory = null!;
    private Mock<ISeasonHealthCheck> _healthCheck = null!;
    private Mock<ISimpleOnewayAdapter<SeasonHealthDtoAdapter.SeasonAndDivisions, SeasonHealthDto>> _seasonAdapter = null!;
    private UserDto? _user;
    private SeasonDto _season = null!;
    private DivisionDataDto _division1 = null!;
    private DivisionDataDto _division2 = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _seasonService = new Mock<ICachingSeasonService>();
        _divisionService = new Mock<ICachingDivisionService>();
        _healthCheckFactory = new Mock<ISeasonHealthCheckFactory>();
        _healthCheck = new Mock<ISeasonHealthCheck>();
        _seasonAdapter = new Mock<ISimpleOnewayAdapter<SeasonHealthDtoAdapter.SeasonAndDivisions, SeasonHealthDto>>();
        _service = new HealthCheckService(
            _userService.Object,
            _seasonService.Object,
            _divisionService.Object,
            _healthCheckFactory.Object,
            _seasonAdapter.Object);
        _user = new UserDto
        {
            Access = new AccessDto
            {
                RunHealthChecks = true,
            },
        };
        _division1 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        _division2 = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
        };
        _season = new SeasonDtoBuilder()
            .WithDivisions(
                new DivisionDtoBuilder().Build(),
                new DivisionDtoBuilder().Build())
            .Build();

        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _divisionService
            .Setup(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.DivisionId.Contains(_division1.Id) && f.SeasonId == _season.Id && f.IgnoreDates), _token))
            .ReturnsAsync(_division1);
        _divisionService
            .Setup(s => s.GetDivisionData(It.Is<DivisionDataFilter>(f => f.DivisionId.Contains(_division2.Id) && f.SeasonId == _season.Id && f.IgnoreDates), _token))
            .ReturnsAsync(_division2);
        _healthCheckFactory.Setup(f => f.GetHealthChecks()).Returns(new[]
        {
            _healthCheck.Object,
        });
        _healthCheck.Setup(c => c.Name).Returns("CHECK");
    }

    [Test]
    public async Task Check_WhenNotLoggedIn_ShouldReturnNotPermitted()
    {
        _user = null;

        var result = await _service.Check(Guid.NewGuid(), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("Not permitted"));
    }

    [Test]
    public async Task Check_WhenNotPermitted_ShouldReturnNotPermitted()
    {
        _user!.Access!.RunHealthChecks = false;

        var result = await _service.Check(Guid.NewGuid(), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("Not permitted"));
    }

    [Test]
    public async Task Check_GivenMissingSeasonId_ShouldReturnNotFound()
    {
        var result = await _service.Check(Guid.NewGuid(), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member("Season not found"));
    }

    [Test]
    public async Task Check_GivenNoDivisionsForSeason_ShouldReturnSuccess()
    {
        var emptySeason = new SeasonDtoBuilder().Build();
        var emptySeasonHealth = new SeasonHealthDto();
        _seasonService.Setup(s => s.Get(emptySeason.Id, _token)).ReturnsAsync(emptySeason);
        _seasonAdapter
            .Setup(a => a.Adapt(It.IsAny<SeasonHealthDtoAdapter.SeasonAndDivisions>(), _token))
            .ReturnsAsync(emptySeasonHealth);

        var result = await _service.Check(emptySeason.Id, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_GivenMissingDivision_ShouldReturnFailure()
    {
        var divisionId = Guid.NewGuid();
        var seasonWithMissingDivision = new SeasonDtoBuilder()
            .WithDivisions(new DivisionDtoBuilder(divisionId).Build())
            .Build();
        _seasonService.Setup(s => s.Get(seasonWithMissingDivision.Id, _token)).ReturnsAsync(seasonWithMissingDivision);
        _divisionService
            .Setup(d => d.GetDivisionData(It.Is<DivisionDataFilter>(f => f.DivisionId.Contains(divisionId)), _token))
            .ReturnsAsync(() => new DivisionDataDto
            {
                Id = divisionId,
                DataErrors =
                {
                    new DataErrorDto
                    {
                        Message = $"Requested division ({divisionId}) was not found",
                    },
                },
            });
        _healthCheck.Setup(c => c.RunCheck(It.IsAny<IReadOnlyCollection<DivisionHealthDto>>(), It.IsAny<HealthCheckContext>(), _token))
            .ReturnsAsync(() => new HealthCheckResultDto
            {
                Success = true,
            });
        _seasonAdapter
            .Setup(a => a.Adapt(It.IsAny<SeasonHealthDtoAdapter.SeasonAndDivisions>(), _token))
            .ReturnsAsync(new SeasonHealthDto());

        var result = await _service.Check(seasonWithMissingDivision.Id, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Has.Member($"Requested division ({divisionId}) was not found"));
    }

    [Test]
    public async Task Check_GivenNoDivisions_ShouldReturnSuccess()
    {
        var seasonHealthDto = new SeasonHealthDto();

        var result = await _service.Check(seasonHealthDto, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "No divisions",
        }));
    }

    [Test]
    public async Task Check_GivenAllChecksSucceed_ShouldReturnSuccess()
    {
        var seasonHealthDto = new SeasonHealthDto
        {
            Divisions =
            {
                new DivisionHealthDto(),
            },
        };
        _healthCheck.Setup(c => c.RunCheck(It.IsAny<IReadOnlyCollection<DivisionHealthDto>>(), It.IsAny<HealthCheckContext>(), _token))
            .ReturnsAsync(() => new HealthCheckResultDto
            {
                Success = true,
                Errors =
                {
                    "Check errors",
                },
                Warnings =
                {
                    "Check warnings",
                },
                Messages =
                {
                    "Check messages",
                },
            });

        var result = await _service.Check(seasonHealthDto, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task Check_GivenACheckFails_ShouldReturnFailure()
    {
        var seasonHealthDto = new SeasonHealthDto
        {
            Divisions =
            {
                new DivisionHealthDto(),
            },
        };
        _healthCheck.Setup(c => c.RunCheck(seasonHealthDto.Divisions, It.IsAny<HealthCheckContext>(), _token))
            .ReturnsAsync(() => new HealthCheckResultDto
            {
                Success = false,
                Errors =
                {
                    "Check errors",
                },
                Warnings =
                {
                    "Check warnings",
                },
                Messages =
                {
                    "Check messages",
                },
            });

        var result = await _service.Check(seasonHealthDto, _token);

        Assert.That(result.Success, Is.False);
    }
}