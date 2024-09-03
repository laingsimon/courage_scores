using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using CourageScores.Tests.Services;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionPlayerAdapterTests
{
    private readonly CancellationToken _token = new();
    private readonly DivisionData.PlayerPlayScore _singles = new()
    {
        MatchesPlayed = 1,
        MatchesWon = 2,
        MatchesLost = 3,
        PlayerWinRate = 9,
        TeamWinRate = 10,
    };
    private readonly DivisionData.PlayerPlayScore _pairs = new();
    private readonly DivisionData.PlayerPlayScore _triples = new();
    private readonly PlayerPerformanceDto _singlesDto = new()
    {
        MatchesPlayed = 1,
        MatchesWon = 2,
        MatchesLost = 3,
        WinRate = 9,
        TeamWinRate = 10,
    };
    private readonly PlayerPerformanceDto _pairsDto = new();
    private readonly PlayerPerformanceDto _triplesDto = new();
    private DivisionPlayerAdapter _adapter = null!;
    private Mock<IPlayerPerformanceAdapter> _performanceAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _performanceAdapter = new Mock<IPlayerPerformanceAdapter>();
        _adapter = new DivisionPlayerAdapter(_performanceAdapter.Object);

        _performanceAdapter.Setup(a => a.Adapt(_singles, _token)).ReturnsAsync(_singlesDto);
        _performanceAdapter.Setup(a => a.Adapt(_pairs, _token)).ReturnsAsync(_pairsDto);
        _performanceAdapter.Setup(a => a.Adapt(_triples, _token)).ReturnsAsync(_triplesDto);
    }

    [Test]
    public async Task Adapt_GivenNoFixtures_SetsPropertiesCorrectly()
    {
        var score = new DivisionData.PlayerScore
        {
            OneEighties = 3,
            HiCheckout = 4,
            PlayerPlayCount =
            {
                {
                    1, _singles
                },
                {
                    2, _pairs
                },
                {
                    3, _triples
                },
            },
        };
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "address",
            Name = "team",
        };
        var player = new TeamPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "player",
            Captain = true,
            Updated = new DateTime(2001, 02, 03),
        };
        var playerTuple = new DivisionData.TeamPlayerTuple(player, team);
        var fixtures = new Dictionary<DateTime, Guid>();
        var division = new DivisionDtoBuilder().Build();

        var result = await _adapter.Adapt(score, playerTuple, fixtures, division, _token);

        Assert.That(result.Id, Is.EqualTo(player.Id));
        Assert.That(result.Captain, Is.EqualTo(player.Captain));
        Assert.That(result.Name, Is.EqualTo(player.Name));
        Assert.That(result.Singles, Is.SameAs(_singlesDto));
        Assert.That(result.OneEighties, Is.EqualTo(score.OneEighties));
        Assert.That(result.Over100Checkouts, Is.EqualTo(score.HiCheckout));
        Assert.That(result.Pairs, Is.SameAs(_pairsDto));
        Assert.That(result.Triples, Is.SameAs(_triplesDto));
        Assert.That(result.Points, Is.EqualTo(9));
        Assert.That(result.WinPercentage, Is.EqualTo(200.00d).Within(0.001));
        Assert.That(result.TeamId, Is.EqualTo(team.Id));
        Assert.That(result.Team, Is.EqualTo(team.Name));
        Assert.That(result.Fixtures, Is.EqualTo(fixtures));
        Assert.That(result.Updated, Is.EqualTo(player.Updated));
        Assert.That(result.Division, Is.EqualTo(division));
    }

    [Test]
    public async Task Adapt_GivenNoFixtures_TrimsWhitespace()
    {
        var score = new DivisionData.PlayerScore
        {
            OneEighties = 3,
            HiCheckout = 4,
            PlayerPlayCount =
            {
                {
                    1, _singles
                },
                {
                    2, _pairs
                },
                {
                    3, _triples
                },
            },
        };
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Address = "address  ",
            Name = "team  ",
        };
        var player = new TeamPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "player   ",
            Captain = true,
            Updated = new DateTime(2001, 02, 03),
        };
        var playerTuple = new DivisionData.TeamPlayerTuple(player, team);
        var fixtures = new Dictionary<DateTime, Guid>();
        var division = new DivisionDtoBuilder().Build();

        var result = await _adapter.Adapt(score, playerTuple, fixtures, division, _token);

        Assert.That(result.Team, Is.EqualTo("team"));
        Assert.That(result.Name, Is.EqualTo("player"));
    }

    [Test]
    public async Task Adapt_GivenNoFixturesAndNoDivision_SetsDivisionToNull()
    {
        var score = new DivisionData.PlayerScore
        {
            OneEighties = 3,
            HiCheckout = 4,
            PlayerPlayCount =
            {
                {
                    1, _singles
                },
                {
                    2, _pairs
                },
                {
                    3, _triples
                },
            },
        };
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "",
        };
        var player = new TeamPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "",
        };
        var playerTuple = new DivisionData.TeamPlayerTuple(player, team);
        var fixtures = new Dictionary<DateTime, Guid>();

        var result = await _adapter.Adapt(score, playerTuple, fixtures, null, _token);

        Assert.That(result.Division, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenTeamPlayerDto_SetsPropertiesCorrectly()
    {
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team",
        };
        var player = new TeamPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Player",
            Captain = true,
            Updated = new DateTime(2001, 02, 03),
        };
        var division = new DivisionDtoBuilder().Build();

        var result = await _adapter.Adapt(team, player, division, _token);

        Assert.That(result.Id, Is.EqualTo(player.Id));
        Assert.That(result.Captain, Is.EqualTo(player.Captain));
        Assert.That(result.Name, Is.EqualTo(player.Name));
        Assert.That(result.Singles, Is.Not.Null);
        Assert.That(result.OneEighties, Is.EqualTo(0));
        Assert.That(result.Over100Checkouts, Is.EqualTo(0));
        Assert.That(result.Pairs, Is.Not.Null);
        Assert.That(result.Triples, Is.Not.Null);
        Assert.That(result.Points, Is.EqualTo(0));
        Assert.That(result.WinPercentage, Is.EqualTo(0d).Within(0.001));
        Assert.That(result.TeamId, Is.EqualTo(team.Id));
        Assert.That(result.Team, Is.EqualTo(team.Name));
        Assert.That(result.Fixtures, Is.Empty);
        Assert.That(result.Updated, Is.EqualTo(player.Updated));
        Assert.That(result.Division, Is.EqualTo(division));
    }

    [Test]
    public async Task Adapt_GivenTeamPlayerDto_TrimsWhitespace()
    {
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "Team  ",
        };
        var player = new TeamPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Player   ",
            Captain = true,
            Updated = new DateTime(2001, 02, 03),
        };
        var division = new DivisionDtoBuilder().Build();

        var result = await _adapter.Adapt(team, player, division, _token);

        Assert.That(result.Name, Is.EqualTo("Player"));
        Assert.That(result.Team, Is.EqualTo("Team"));
    }

    [Test]
    public async Task Adapt_GivenTeamPlayerDtoAndNoDivision_SetsDivisionToNull()
    {
        var team = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "",
        };
        var player = new TeamPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "",
        };

        var result = await _adapter.Adapt(team, player, null, _token);

        Assert.That(result.Division, Is.Null);
    }
}