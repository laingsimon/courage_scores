using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CourageScores.Services.Team;
using Moq;
using NUnit.Framework;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Tests.Services.Team;

[TestFixture]
public class TeamServiceTests
{
    private readonly CancellationToken _token = new();
    private Mock<IAdapter<CosmosTeam, TeamDto>> _adapter = null!;
    private TeamService _service = null!;
    private Mock<IGenericRepository<CosmosTeam>> _repository = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private List<CosmosTeam> _allTeams = null!;
    private List<CosmosTeam> _someTeams = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _repository = new Mock<IGenericRepository<CosmosTeam>>();
        _userService = new Mock<IUserService>();
        _auditingHelper = new Mock<IAuditingHelper>();
        _repository = new Mock<IGenericRepository<CosmosTeam>>();
        _allTeams = new List<CosmosTeam>();
        _someTeams = new List<CosmosTeam>();
        _adapter = new Mock<IAdapter<CosmosTeam, TeamDto>>();
        _service = new TeamService(
            _repository.Object,
            _adapter.Object,
            _userService.Object,
            _auditingHelper.Object,
            new ActionResultAdapter());

        _repository.Setup(r => r.GetAll(_token)).Returns(() => TestUtilities.AsyncEnumerable(_allTeams.ToArray()));
        _repository.Setup(r => r.GetSome(It.IsAny<string>(), _token)).Returns(() => TestUtilities.AsyncEnumerable(_someTeams.ToArray()));
        _adapter
            .Setup(a => a.Adapt(It.IsAny<CosmosTeam>(), _token))
            .ReturnsAsync((CosmosTeam t, CancellationToken _) => new TeamDto
            {
                Id = t.Id,
                Seasons = t.Seasons.Select(ts => new TeamSeasonDto
                {
                    Id = ts.Id,
                    SeasonId = ts.SeasonId,
                }).ToList(),
            });
    }

    [Test]
    public async Task GetTeamsForSeason_GivenSeasonId_ReturnsTeamsForGivenSeason()
    {
        var seasonId = Guid.NewGuid();
        var teamInSeason = new CosmosTeam
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeason
                {
                    SeasonId = seasonId,
                },
                new TeamSeason
                {
                    SeasonId = Guid.NewGuid(),
                },
            },
        };
        var teamNotInSeason = new CosmosTeam
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeason
                {
                    SeasonId = Guid.NewGuid(),
                },
            },
        };
        _allTeams.AddRange(new[]
        {
            teamInSeason, teamNotInSeason,
        });

        var teams = await _service.GetTeamsForSeason(seasonId, _token).ToList();

        _repository.Verify(r => r.GetAll(_token));
        Assert.That(teams.Select(t => t.Id), Is.EquivalentTo(new[]
        {
            teamInSeason.Id,
        }));
        Assert.That(teams.SelectMany(t => t.Seasons.Select(s => s.SeasonId)), Has.All.EqualTo(seasonId));
    }

    [Test]
    public async Task GetTeamsForSeason_GivenSeasonAndDivisionId_ReturnsTeamsForGivenSeason()
    {
        var seasonId = Guid.NewGuid();
        var divisionId = Guid.NewGuid();
        var teamInSeasonAndDivision = new CosmosTeam
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeason
                {
                    SeasonId = seasonId,
                    DivisionId = divisionId,
                },
                new TeamSeason
                {
                    SeasonId = Guid.NewGuid(),
                    DivisionId = divisionId,
                },
            },
        };
        var teamInDivisionNotSeason = new CosmosTeam
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeason
                {
                    SeasonId = Guid.NewGuid(),
                    DivisionId = divisionId,
                },
            },
        };
        _someTeams.AddRange(new[]
        {
            teamInDivisionNotSeason, teamInSeasonAndDivision,
        });

        var teams = await _service.GetTeamsForSeason(divisionId, seasonId, _token).ToList();

        _repository.Verify(r => r.GetSome($"t.DivisionId = '{divisionId}'", _token));
        Assert.That(teams.Select(t => t.Id), Is.EquivalentTo(new[]
        {
            teamInSeasonAndDivision.Id,
        }));
        Assert.That(teams.SelectMany(t => t.Seasons.Select(s => s.SeasonId)), Has.All.EqualTo(seasonId));
    }
}