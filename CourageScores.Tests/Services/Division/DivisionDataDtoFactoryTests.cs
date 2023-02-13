using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;
using Moq;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Tests.Services.Division;

[TestFixture]
public class DivisionDataDtoFactoryTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private DivisionDataDtoFactory _factory = null!;
    private IDivisionPlayerAdapter _divisionPlayerAdapter = null!;
    private IDivisionTeamAdapter _divisionTeamAdapter = null!;
    private IDivisionTeamDetailsAdapter _divisionTeamDetailsAdapter = null!;
    private IDivisionDataSeasonAdapter _divisionDataSeasonAdapter = null!;
    private Mock<IDivisionFixtureDateAdapter> _divisionFixtureDateAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _divisionPlayerAdapter = new DivisionPlayerAdapter(new PlayerPerformanceAdapter());
        _divisionTeamAdapter = new DivisionTeamAdapter();
        _divisionTeamDetailsAdapter = new DivisionTeamDetailsAdapter();
        _divisionDataSeasonAdapter = new DivisionDataSeasonAdapter();
        _divisionFixtureDateAdapter = new Mock<IDivisionFixtureDateAdapter>();

        _factory = new DivisionDataDtoFactory(
            _divisionPlayerAdapter,
            _divisionTeamAdapter,
            _divisionTeamDetailsAdapter,
            _divisionDataSeasonAdapter,
            _divisionFixtureDateAdapter.Object);

        _divisionFixtureDateAdapter
            .Setup(a => a.Adapt(
                It.IsAny<DateTime>(),
                It.IsAny<CosmosGame[]>(),
                It.IsAny<TournamentGame[]>(),
                It.IsAny<List<FixtureDateNoteDto>>(),
                It.IsAny<IReadOnlyCollection<TeamDto>>(),
                _token))
            .ReturnsAsync(
                (DateTime date, CosmosGame[] _, TournamentGame[] _, List<FixtureDateNoteDto> _,
                    IReadOnlyCollection<TeamDto> _, CancellationToken _) => new DivisionFixtureDateDto
                {
                    Date = date,
                });
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDivision_SetsDivisionPropertiesCorrectly()
    {
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            Array.Empty<SeasonDto>());
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "division 1",
        };

        var result = await _factory.CreateDivisionDataDto(context, division, _token);

        Assert.That(result.Id, Is.EqualTo(division.Id));
        Assert.That(result.Name, Is.EqualTo("division 1"));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenNoDivision_SetsDivisionPropertiesCorrectly()
    {
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            Array.Empty<SeasonDto>());

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.Id, Is.EqualTo(Guid.Empty));
        Assert.That(result.Name, Is.EqualTo("<all divisions>"));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenTeams_SetsTeamsCorrectly()
    {
        var team1 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 1 - Playing" };
        var team2 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 2 - Playing" };
        var team3 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 3 - Not Playing" };
        var game = new CosmosGame
        {
            Home = new GameTeam { Id = team1.Id },
            Away = new GameTeam { Id = team2.Id },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers = { new GamePlayer { Id = Guid.NewGuid() } },
                    AwayPlayers = { new GamePlayer { Id = Guid.NewGuid() } },
                },
            },
        };
        var context = new DivisionDataContext(
            new[] { game },
            Array.Empty<TeamDto>(),
            new List<TeamDto> { team1, team2, team3 },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            Array.Empty<SeasonDto>());

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.Teams.Select(t => t.Name), Is.EqualTo(new[]
        {
            "Team 2 - Playing", // more points
            "Team 1 - Playing",
            "Team 3 - Not Playing"
        }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenAllTeams_SetsAllTeamsCorrectly()
    {
        var team1 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 1 - Playing" };
        var team2 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 2 - Playing" };
        var team3 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 3 - Not Playing" };
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            new List<TeamDto> { team1, team2, team3 },
            new List<TeamDto> { team1 },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            Array.Empty<SeasonDto>());

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.AllTeams.Select(t => t.Name), Is.EqualTo(new[]
        {
            "Team 1 - Playing",
            "Team 2 - Playing",
            "Team 3 - Not Playing"
        }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenFixtures_SetsFixturesCorrectly()
    {
        var team1 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 1 - Playing" };
        var team2 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 2 - Playing" };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam { Id = team1.Id },
            Away = new GameTeam { Id = team2.Id },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers = { new GamePlayer { Id = Guid.NewGuid() } },
                    AwayPlayers = { new GamePlayer { Id = Guid.NewGuid() } },
                },
            },
        };
        var context = new DivisionDataContext(
            new[] { game },
            new List<TeamDto> { team1, team2 },
            new List<TeamDto> { team1, team2 },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            Array.Empty<SeasonDto>());

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.Fixtures.Select(f => f.Date), Is.EquivalentTo(new[] { game.Date }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenSeason_SetsSeasonCorrectly()
    {
        var season = new SeasonDto { Id = Guid.NewGuid(), Name = "season" };
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season,
            Array.Empty<SeasonDto>());

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.Season.Id, Is.EqualTo(season.Id));
        Assert.That(result.Season.Name, Is.EqualTo(season.Name));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenAllSeasons_SetsSeasonsCorrectly()
    {
        var season1 = new SeasonDto { Id = Guid.NewGuid(), Name = "season1" };
        var season2 = new SeasonDto { Id = Guid.NewGuid(), Name = "season2" };
        var context = new DivisionDataContext(
            Array.Empty<CosmosGame>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TeamDto>(),
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            season1,
            new[] { season1, season2 });

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.Seasons.Select(s => s.Id), Is.EquivalentTo(new[] { season1.Id, season2.Id }));
        Assert.That(result.Seasons.Select(s => s.Name), Is.EquivalentTo(new[] { season1.Name, season2.Name }));
    }

    [Test]
    public async Task CreateDivisionDataDto_GivenDataErrors_SetsDataErrorsCorrectly()
    {
        var team1 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 1 - Playing" };
        var team2 = new TeamDto { Id = Guid.NewGuid(), Name = "Team 2 - Playing" };
        var game = new CosmosGame
        {
            Date = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            Home = new GameTeam { Id = team1.Id },
            Away = new GameTeam { Id = team2.Id },
            Matches =
            {
                new GameMatch
                {
                    HomeScore = 2,
                    AwayScore = 3,
                    HomePlayers = { new GamePlayer { Id = Guid.NewGuid(), Name = "A" } },
                    AwayPlayers = { new GamePlayer { Id = Guid.NewGuid(), Name = "B" }, new GamePlayer { Id = Guid.NewGuid(), Name = "C" } },
                },
            },
        };
        var context = new DivisionDataContext(
            new[] { game },
            new List<TeamDto> { team1, team2 },
            new List<TeamDto> { team1, team2 },
            Array.Empty<TournamentGame>(),
            Array.Empty<FixtureDateNoteDto>(),
            new SeasonDto(),
            Array.Empty<SeasonDto>());

        var result = await _factory.CreateDivisionDataDto(context, null, _token);

        Assert.That(result.DataErrors, Is.EqualTo(new[] { "Mismatching number of players: Home players: [A] vs Away players: [B, C]" }));
    }

    [Test]
    public async Task SeasonNotFound_GivenNoDivision_ShouldReturnCorrectly()
    {
        var season1 = new SeasonDto { Id = Guid.NewGuid(), Name = "season1" };
        var season2 = new SeasonDto { Id = Guid.NewGuid(), Name = "season2" };
        var seasons = new[] { season1, season2 };

        var result = await _factory.SeasonNotFound(null, seasons, _token);

        Assert.That(result.Id, Is.EqualTo(Guid.Empty));
        Assert.That(result.Name, Is.EqualTo("<all divisions>"));
        Assert.That(result.Seasons.Select(s => s.Name), Is.EqualTo(new[] { "season1", "season2" }));
    }

    [Test]
    public async Task SeasonNotFound_GivenDivision_ShouldReturnCorrectly()
    {
        var season1 = new SeasonDto { Id = Guid.NewGuid(), Name = "season1" };
        var season2 = new SeasonDto { Id = Guid.NewGuid(), Name = "season2" };
        var seasons = new[] { season1, season2 };
        var division = new DivisionDto
        {
            Id = Guid.NewGuid(),
            Name = "division1"
        };

        var result = await _factory.SeasonNotFound(division, seasons, _token);

        Assert.That(result.Id, Is.EqualTo(division.Id));
        Assert.That(result.Name, Is.EqualTo("division1"));
        Assert.That(result.Seasons.Select(s => s.Name), Is.EqualTo(new[] { "season1", "season2" }));
    }
}