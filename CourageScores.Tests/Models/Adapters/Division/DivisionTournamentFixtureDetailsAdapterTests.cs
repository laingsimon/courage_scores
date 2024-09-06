using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Tests.Models.Cosmos.Game;
using CourageScores.Tests.Models.Dtos;
using CourageScores.Tests.Services;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionTournamentFixtureDetailsAdapterTests
{
    private static readonly SeasonDto Season = new SeasonDtoBuilder().Build();
    private static readonly TeamDto Team1 = new TeamDtoBuilder().WithName("team1").WithAddress("address").Build();
    private static readonly TeamDto Team2 = new TeamDtoBuilder().WithName("team2").WithAddress("address").Build();

    private readonly CancellationToken _token = new();
    private DivisionTournamentFixtureDetailsAdapter _adapter = null!;
    private Mock<IAdapter<TournamentSide, TournamentSideDto>> _tournamentSideAdapter = null!;
    private Mock<ITournamentTypeResolver> _tournamentTypeResolver = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _tournamentSideAdapter = new Mock<IAdapter<TournamentSide, TournamentSideDto>>();
        _tournamentTypeResolver = new Mock<ITournamentTypeResolver>();
        _adapter = new DivisionTournamentFixtureDetailsAdapter(_tournamentSideAdapter.Object, _tournamentTypeResolver.Object);

        _tournamentTypeResolver.Setup(r => r.GetTournamentType(It.IsAny<TournamentGame>())).Returns("TOURNAMENT TYPE");
    }

    [Test]
    public async Task Adapt_GivenNoRound_SetsPropertiesCorrectly()
    {
        var winner = new TournamentSideBuilder()
            .WithPlayer("PLAYER 1", Guid.Parse("B5817736-EF78-4FFE-9701-0B8DF9490357"))
            .Build();
        var runnerUp = new TournamentSideBuilder()
            .WithPlayer("PLAYER 2", Guid.Parse("126B746E-CFF8-4869-8FB9-75D9E0D8AC5C"))
            .Build();
        var game = new TournamentGameBuilder()
            .WithSeason(Season)
            .WithDate(new DateTime(2001, 02, 03))
            .WithType("TOURNAMENT TYPE")
            .WithAddress("address")
            .WithNotes("notes")
            .WithSides(winner, runnerUp)
            .Build();
        var winnerDto = new TournamentSideDto();
        var runnerUpDto = new TournamentSideDto();
        _tournamentSideAdapter.Setup(a => a.Adapt(winner, _token)).ReturnsAsync(winnerDto);
        _tournamentSideAdapter.Setup(a => a.Adapt(runnerUp, _token)).ReturnsAsync(runnerUpDto);

        var result = await _adapter.Adapt(game, _token);

        Assert.That(result.Address, Is.EqualTo(game.Address));
        Assert.That(result.Date, Is.EqualTo(game.Date));
        Assert.That(result.Type, Is.EqualTo(game.Type));
        Assert.That(result.Notes, Is.EqualTo(game.Notes));
        Assert.That(result.Sides, Is.EqualTo(new[] { winnerDto, runnerUpDto }));
        Assert.That(result.Id, Is.EqualTo(game.Id));
        Assert.That(result.Players, Is.EqualTo(new[]
        {
            Guid.Parse("B5817736-EF78-4FFE-9701-0B8DF9490357"),
            Guid.Parse("126B746E-CFF8-4869-8FB9-75D9E0D8AC5C"),
        }));
        Assert.That(result.Proposed, Is.False);
        Assert.That(result.SeasonId, Is.EqualTo(game.SeasonId));
        Assert.That(result.WinningSide, Is.EqualTo(null));
    }

    [Test]
    public async Task Adapt_GivenNoWinningRound_WinnerToNull()
    {
        var game = new TournamentGameBuilder()
            .WithRound(new TournamentRound())
            .Build();

        var result = await _adapter.Adapt(game, _token);

        Assert.That(result.WinningSide, Is.EqualTo(null));
    }

    [TestCase(3, 2, 1, "A")]
    [TestCase(3, 1, 2, "B")]
    [TestCase(5, 2, 1, null)]
    [TestCase(5, 1, 2, null)]
    [TestCase(null, 2, 1, null)]
    [TestCase(null, 1, 2, null)]
    [TestCase(null, 3, 1, "A")]
    [TestCase(null, 1, 3, "B")]
    public async Task Adapt_GivenWinningRound_SetsPropertiesCorrectly(int? bestOf, int scoreA, int scoreB, string? winnerName)
    {
        var sideA = new TournamentSideBuilder("A").Build();
        var sideB = new TournamentSideBuilder("B").Build();
        var game = new TournamentGameBuilder()
            .WithRound(r1 => r1.WithRound(r2 => r2
                .WithSide(sideA, sideB)
                .WithMatch(m => m.WithSides(sideA, sideB).WithScores(scoreA, scoreB))
                .WithMatchOption(new GameMatchOption
                {
                    NumberOfLegs = bestOf,
                })))
            .Build();
        var sideADto = new TournamentSideDto
        {
            Name = "A",
        };
        var sideBDto = new TournamentSideDto
        {
            Name = "B",
        };
        _tournamentSideAdapter.Setup(a => a.Adapt(sideA, _token)).ReturnsAsync(sideADto);
        _tournamentSideAdapter.Setup(a => a.Adapt(sideB, _token)).ReturnsAsync(sideBDto);

        var result = await _adapter.Adapt(game, _token);

        if (winnerName == null)
        {
            Assert.That(result.WinningSide, Is.Null);
        }
        else
        {
            Assert.That(result.WinningSide, Is.Not.Null);
            Assert.That(result.WinningSide!.Name, Is.EqualTo(winnerName));
        }
    }

    [Test]
    public async Task ForUnselectedVenue_WithSingleTeam_ReturnsCorrectly()
    {
        var result = await _adapter.ForUnselectedVenue(new[] { Team1 }, _token);

        Assert.That(result.Address, Is.EqualTo("address"));
        Assert.That(result.Id, Is.EqualTo(default(Guid)));
        Assert.That(result.Proposed, Is.True);
        Assert.That(result.Players, Is.Empty);
        Assert.That(result.Date, Is.EqualTo(default(DateTime)));
        Assert.That(result.Notes, Is.Null);
        Assert.That(result.Type, Is.Null);
        Assert.That(result.Sides, Is.Empty);
        Assert.That(result.SeasonId, Is.EqualTo(default(Guid)));
        Assert.That(result.WinningSide, Is.Null);
    }

    [Test]
    public async Task ForUnselectedVenue_WithMultipleTeams_ReturnsCorrectly()
    {
        var result = await _adapter.ForUnselectedVenue(new[] { Team1, Team2 }, _token);

        Assert.That(result.Address, Is.EqualTo("address"));
        Assert.That(result.Id, Is.EqualTo(default(Guid)));
        Assert.That(result.Proposed, Is.True);
        Assert.That(result.Players, Is.Empty);
        Assert.That(result.Date, Is.EqualTo(default(DateTime)));
        Assert.That(result.Notes, Is.Null);
        Assert.That(result.Type, Is.Null);
        Assert.That(result.Sides, Is.Empty);
        Assert.That(result.SeasonId, Is.EqualTo(default(Guid)));
    }
}