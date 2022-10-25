using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using CourageScores.Services.Team;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Team;

[TestFixture]
public class TeamServiceTests
{
#pragma warning disable CS8618
    private Mock<ITeamRepository> _teamRepository;
    private Mock<IAuditingAdapter<CourageScores.Models.Cosmos.Team.Team, TeamDto>> _teamAdapter;
    private Mock<IAccessService> _accessService;
    private TeamService _service;
    private CancellationToken _token;
#pragma warning restore CS8618

    [SetUp]
    public void Setup()
    {
        _token = CancellationToken.None;
        _teamRepository = new Mock<ITeamRepository>();
        _teamAdapter = new Mock<IAuditingAdapter<CourageScores.Models.Cosmos.Team.Team, TeamDto>>();
        _accessService = new Mock<IAccessService>();

        _service = new TeamService(_teamRepository.Object, _teamAdapter.Object, _accessService.Object);
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
    public async Task UpsertTeam_WhenNotAnAdmin_ReturnsUnsuccessful()
    {
        var teamDto = new TeamDto();
        _accessService.Setup(s => s.CanEditTeam(teamDto)).ReturnsAsync(() => false);

        var result = await _service.UpsertTeam(teamDto, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        _teamRepository.VerifyNoOtherCalls();
    }

    [Test]
    public async Task UpsertTeam_WhenAnAdmin_UpsertsTeam()
    {
        var teamDto = new TeamDto();
        var updatedDto = new TeamDto();
        var team = new CourageScores.Models.Cosmos.Team.Team();
        _teamAdapter.Setup(a => a.Adapt(teamDto)).Returns(team);
        _accessService.Setup(s => s.CanEditTeam(teamDto)).ReturnsAsync(() => true);
        _teamAdapter.Setup(a => a.Adapt(team)).Returns(updatedDto);
        _teamRepository.Setup(r => r.UpsertTeam(team, _token)).ReturnsAsync(() => team);

        var result = await _service.UpsertTeam(teamDto, _token);

        _teamRepository.Verify(r => r.UpsertTeam(It.IsAny<CourageScores.Models.Cosmos.Team.Team>(), _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(updatedDto));
    }

    [Test]
    public async Task DeleteTeam_WhenTeamNotFound_ReturnsUnsuccessful()
    {
        var id = Guid.NewGuid();
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => null);

        var result = await _service.DeleteTeam(id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Team not found" }));
        Assert.That(result.Result, Is.Null);
    }

    [Test]
    public async Task DeleteTeam_WhenNotAnAdmin_ReturnsUnsuccessful()
    {
        var id = Guid.NewGuid();
        var team = new CourageScores.Models.Cosmos.Team.Team();
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => team);
        _accessService.Setup(s => s.CanDeleteTeam(team)).ReturnsAsync(() => false);

        var result = await _service.DeleteTeam(id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not an admin" }));
        Assert.That(result.Result, Is.Null);
        _teamRepository.VerifyNoOtherCalls();
    }

    [Test]
    public async Task DeleteTeam_WhenAnAdmin_UpdatesTeam()
    {
        var id = Guid.NewGuid();
        var deletedTeamDto = new TeamDto();
        var team = new CourageScores.Models.Cosmos.Team.Team();
        _accessService.Setup(s => s.CanDeleteTeam(team)).ReturnsAsync(() => true);
        _teamRepository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => team);
        _teamAdapter.Setup(a => a.Adapt(team)).Returns(deletedTeamDto);

        var result = await _service.DeleteTeam(id, _token);

        _teamRepository.Verify(r => r.UpsertTeam(team, _token));
        _teamAdapter.Verify(a => a.SetDeleted(team));
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