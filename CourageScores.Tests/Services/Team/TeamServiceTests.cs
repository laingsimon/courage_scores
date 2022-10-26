using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CourageScores.Services.Team;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Team;

[TestFixture]
public class TeamServiceTests
{
#pragma warning disable CS8618
    private Mock<IGenericRepository<Models.Cosmos.Team.Team>> _teamRepository;
    private Mock<IAdapter<CourageScores.Models.Cosmos.Team.Team, TeamDto>> _teamAdapter;
    private Mock<IUserService> _userService;
    private TeamService _service;
    private CancellationToken _token;
    private Mock<IAuditingHelper> _auditingHelper;
#pragma warning restore CS8618

    [SetUp]
    public void Setup()
    {
        _token = CancellationToken.None;
        _teamRepository = new Mock<IGenericRepository<Models.Cosmos.Team.Team>>();
        _teamAdapter = new Mock<IAdapter<CourageScores.Models.Cosmos.Team.Team, TeamDto>>();
        _userService = new Mock<IUserService>();
        _auditingHelper = new Mock<IAuditingHelper>();

        _service = new TeamService(_teamRepository.Object, _teamAdapter.Object, _userService.Object, _auditingHelper.Object);
    }

    [Test]
    public async Task GetTeam_WhenTeamNotFound_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => null);

        var result = await _service.GetTeam(id, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetTeam_WhenTeamFound_AdaptsAndReturnsTeam()
    {
        var id = Guid.NewGuid();
        var team = new CourageScores.Models.Cosmos.Team.Team();
        var teamDto = new TeamDto();
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => team);
        _teamAdapter.Setup(a => a.Adapt(team)).Returns(teamDto);

        var result = await _service.GetTeam(id, _token);

        Assert.That(result, Is.Not.Null);
        _teamAdapter.Verify(a => a.Adapt(team));
        Assert.That(result, Is.SameAs(teamDto));
    }

    [Test]
    public async Task GetAllTeams_WhenTeamsFound_AdaptsAllTeams()
    {
        var team = new CourageScores.Models.Cosmos.Team.Team();
        var teamDto = new TeamDto();
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(() => AsyncEnumerable(team));
        _teamAdapter.Setup(a => a.Adapt(team)).Returns(teamDto);
        var returnedTeams = new List<TeamDto>();

        await foreach (var returnedTeam in _service.GetAllTeams(_token))
        {
            returnedTeams.Add(returnedTeam);
        }

        Assert.That(returnedTeams, Is.Not.Empty);
        Assert.That(returnedTeams, Is.EquivalentTo(new[] { teamDto }));
        _teamAdapter.Verify(a => a.Adapt(team));
    }

    [Test]
    public async Task UpdateTeam_WhenNotFound_ReturnsUnsuccessful()
    {
        var id = Guid.NewGuid();
        var command = new Mock<IUpdateCommand<CourageScores.Models.Cosmos.Team.Team, object>>();
        var user = new UserDto
        {
            Access = new AccessDto
            {
                TeamAdmin = true,
            }
        };
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => null);

        var result = await _service.UpdateTeam(id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Team not found" }));
        _teamRepository.Verify(r => r.UpsertTeam(It.IsAny<CourageScores.Models.Cosmos.Team.Team>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task UpdateTeam_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        var team = new CourageScores.Models.Cosmos.Team.Team();
        var id = Guid.NewGuid();
        var command = new Mock<IUpdateCommand<CourageScores.Models.Cosmos.Team.Team, object>>();
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => team);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => null);

        var result = await _service.UpdateTeam(id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not logged in" }));
        _teamRepository.Verify(r => r.UpsertTeam(It.IsAny<CourageScores.Models.Cosmos.Team.Team>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task UpdateTeam_WhenNotAnAdmin_ReturnsUnsuccessful()
    {
        var team = new CourageScores.Models.Cosmos.Team.Team();
        var id = Guid.NewGuid();
        var user = new UserDto
        {
            Access = new AccessDto
            {
                TeamAdmin = false,
                LeagueAdmin = false,
            }
        };
        var command = new Mock<IUpdateCommand<CourageScores.Models.Cosmos.Team.Team, object>>();
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => team);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);

        var result = await _service.UpdateTeam(id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
        _teamRepository.Verify(r => r.UpsertTeam(It.IsAny<CourageScores.Models.Cosmos.Team.Team>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task UpdateTeam_WhenCommandFails_DoesNotUpsertTeam()
    {
        var id = Guid.NewGuid();
        var updatedDto = new TeamDto();
        var team = new CourageScores.Models.Cosmos.Team.Team();
        var updatedTeam = new CourageScores.Models.Cosmos.Team.Team();
        var command = new Mock<IUpdateCommand<CourageScores.Models.Cosmos.Team.Team, object>>();
        var commandResult = new CommandOutcome<object>(false, "some message", null);
        var user = new UserDto
        {
            Access = new AccessDto
            {
                TeamAdmin = true,
                LeagueAdmin = true,
            }
        };
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => team);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
        _teamAdapter.Setup(a => a.Adapt(updatedTeam)).Returns(updatedDto);
        _teamRepository.Setup(r => r.UpsertTeam(team, _token)).ReturnsAsync(() => updatedTeam);
        command.Setup(c => c.ApplyUpdate(team, _token)).ReturnsAsync(() => commandResult);

        var result = await _service.UpdateTeam(id, command.Object, _token);

        _teamRepository.Verify(r => r.UpsertTeam(team, _token), Times.Never);
        command.Verify(c => c.ApplyUpdate(team, _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Result, Is.Null);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "some message" }));
    }

    [Test]
    public async Task UpdateTeam_WhenAnAdmin_UpsertsTeam()
    {
        var id = Guid.NewGuid();
        var updatedDto = new TeamDto();
        var team = new CourageScores.Models.Cosmos.Team.Team();
        var updatedTeam = new CourageScores.Models.Cosmos.Team.Team();
        var command = new Mock<IUpdateCommand<CourageScores.Models.Cosmos.Team.Team, object>>();
        var commandResult = new CommandOutcome<object>(true, "some message", null);
        var user = new UserDto
        {
            Access = new AccessDto
            {
                TeamAdmin = true,
            }
        };
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => team);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
        _teamAdapter.Setup(a => a.Adapt(updatedTeam)).Returns(updatedDto);
        _teamRepository.Setup(r => r.UpsertTeam(team, _token)).ReturnsAsync(() => updatedTeam);
        command.Setup(c => c.ApplyUpdate(team, _token)).ReturnsAsync(() => commandResult);

        var result = await _service.UpdateTeam(id, command.Object, _token);

        _teamRepository.Verify(r => r.UpsertTeam(team, _token));
        command.Verify(c => c.ApplyUpdate(team, _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(updatedDto));
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "some message" }));
    }

    [Test]
    public async Task DeleteTeam_WhenTeamNotFound_ReturnsUnsuccessful()
    {
        var id = Guid.NewGuid();
        var user = new UserDto
        {
            Access = new AccessDto
            {
                TeamAdmin = true,
            }
        };
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => null);

        var result = await _service.DeleteTeam(id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Team not found" }));
        Assert.That(result.Result, Is.Null);
    }

    [Test]
    public async Task DeleteTeam_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        var id = Guid.NewGuid();
        var team = new CourageScores.Models.Cosmos.Team.Team();
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => team);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => null);

        var result = await _service.DeleteTeam(id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not logged in" }));
        Assert.That(result.Result, Is.Null);
        _teamRepository.Verify(r => r.UpsertTeam(It.IsAny<CourageScores.Models.Cosmos.Team.Team>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task DeleteTeam_WhenNotAnAdmin_ReturnsUnsuccessful()
    {
        var id = Guid.NewGuid();
        var team = new CourageScores.Models.Cosmos.Team.Team();
        var user = new UserDto
        {
            Access = new AccessDto
            {
                TeamAdmin = false,
                LeagueAdmin = false,
            }
        };
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => team);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);

        var result = await _service.DeleteTeam(id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
        Assert.That(result.Result, Is.Null);
        _teamRepository.Verify(r => r.UpsertTeam(It.IsAny<CourageScores.Models.Cosmos.Team.Team>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task DeleteTeam_WhenAnAdmin_UpdatesTeam()
    {
        var id = Guid.NewGuid();
        var deletedTeamDto = new TeamDto();
        var team = new CourageScores.Models.Cosmos.Team.Team();
        var user = new UserDto
        {
            Access = new AccessDto
            {
                TeamAdmin = true,
            }
        };
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => team);
        _teamAdapter.Setup(a => a.Adapt(team)).Returns(deletedTeamDto);

        var result = await _service.DeleteTeam(id, _token);

        _teamRepository.Verify(r => r.UpsertTeam(team, _token));
        _auditingHelper.Verify(a => a.SetDeleted(team));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(deletedTeamDto));
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Team deleted" }));
    }

#pragma warning disable CS1998
    private static async IAsyncEnumerable<T> AsyncEnumerable<T>(params T[] items)
#pragma warning restore CS1998
    {
        foreach (var item in items)
        {
            yield return item;
        }
    }
}
