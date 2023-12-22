using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionTournamentFixtureDetailsAdapterTests
{
    private readonly CancellationToken _token = new();
    private DivisionTournamentFixtureDetailsAdapter _adapter = null!;
    private Mock<IAdapter<TournamentSide, TournamentSideDto>> _tournamentSideAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _tournamentSideAdapter = new Mock<IAdapter<TournamentSide, TournamentSideDto>>();
        _adapter = new DivisionTournamentFixtureDetailsAdapter(_tournamentSideAdapter.Object);
    }

    [Test]
    public async Task Adapt_GivenNoRound_SetsPropertiesCorrectly()
    {
        var winner = new TournamentSide
        {
            Players =
            {
                new TournamentPlayer
                {
                    Id = Guid.Parse("B5817736-EF78-4FFE-9701-0B8DF9490357"),
                },
            },
        };
        var runnerUp = new TournamentSide
        {
            Players =
            {
                new TournamentPlayer
                {
                    Id = Guid.Parse("126B746E-CFF8-4869-8FB9-75D9E0D8AC5C"),
                },
            },
        };
        var game = new TournamentGame
        {
            Id = Guid.NewGuid(),
            Notes = "notes",
            Address = "address",
            SeasonId = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
            Type = "type",
            Sides =
            {
                winner,
                runnerUp,
            },
        };
        var winnerDto = new TournamentSideDto();
        var runnerUpDto = new TournamentSideDto();
        _tournamentSideAdapter.Setup(a => a.Adapt(winner, _token)).ReturnsAsync(winnerDto);
        _tournamentSideAdapter.Setup(a => a.Adapt(runnerUp, _token)).ReturnsAsync(runnerUpDto);

        var result = await _adapter.Adapt(game, _token);

        Assert.That(result.Address, Is.EqualTo(game.Address));
        Assert.That(result.Date, Is.EqualTo(game.Date));
        Assert.That(result.Type, Is.EqualTo(game.Type));
        Assert.That(result.Notes, Is.EqualTo(game.Notes));
        Assert.That(result.Sides, Is.EqualTo(new[]
        {
            winnerDto, runnerUpDto,
        }));
        Assert.That(result.Id, Is.EqualTo(game.Id));
        Assert.That(result.Players, Is.EqualTo(new[]
        {
            Guid.Parse("B5817736-EF78-4FFE-9701-0B8DF9490357"), Guid.Parse("126B746E-CFF8-4869-8FB9-75D9E0D8AC5C"),
        }));
        Assert.That(result.Proposed, Is.False);
        Assert.That(result.SeasonId, Is.EqualTo(game.SeasonId));
        Assert.That(result.WinningSide, Is.EqualTo(null));
    }

    [TestCase(0, 0, "Tournament")]
    [TestCase(1, 0, "Tournament")]
    [TestCase(1, 1, "Singles")]
    [TestCase(1, 2, "Pairs")]
    [TestCase(1, 3, "Tournament")]
    public async Task Adapt_GivenNoTypeOverride_CalculatesTypeCorrectly(int sideCount, int playerCount, string expectedTypeName)
    {
        var game = new TournamentGame
        {
            Id = Guid.NewGuid(),
            Type = null,
            Sides = Enumerable.Range(1, sideCount).Select(sideNo => new TournamentSide
            {
                Name = sideNo.ToString(),
                Players = Enumerable.Range(1, playerCount).Select(playerNo => new TournamentPlayer
                {
                    Name = playerNo.ToString(),
                }).ToList(),
            }).ToList(),
        };
        var sideDto = new TournamentSideDto();
        _tournamentSideAdapter.Setup(a => a.Adapt(It.IsAny<TournamentSide>(), _token)).ReturnsAsync(sideDto);

        var result = await _adapter.Adapt(game, _token);

        Assert.That(result.Type, Is.EqualTo(expectedTypeName));
    }

    [Test]
    public async Task Adapt_GivenNoWinningRound_WinnerToNull()
    {
        var game = new TournamentGame
        {
            Id = Guid.NewGuid(),
            Round = new TournamentRound(),
        };

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
        var sideA = new TournamentSide
        {
            Name = "A",
        };
        var sideB = new TournamentSide
        {
            Name = "B",
        };
        var game = new TournamentGame
        {
            Id = Guid.NewGuid(),
            Round = new TournamentRound
            {
                NextRound = new TournamentRound
                {
                    Sides =
                    {
                        sideA,
                        sideB,
                    },
                    Matches =
                    {
                        new TournamentMatch
                        {
                            SideA = sideA,
                            SideB = sideB,
                            ScoreA = scoreA,
                            ScoreB = scoreB,
                        },
                    },
                    MatchOptions =
                    {
                        new GameMatchOption
                        {
                            NumberOfLegs = bestOf,
                        },
                    },
                },
            },
        };
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
        var teamsWithSameAddress = new[]
        {
            new TeamDto
            {
                Id = Guid.NewGuid(),
                Name = "team1",
                Address = "address",
            },
        };

        var result = await _adapter.ForUnselectedVenue(teamsWithSameAddress, _token);

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

    [Test]
    public async Task ForUnselectedVenue_WithMultipleTeams_ReturnsCorrectly()
    {
        var teamsWithSameAddress = new[]
        {
            new TeamDto
            {
                Id = Guid.NewGuid(),
                Name = "team1",
                Address = "address",
            },
            new TeamDto
            {
                Id = Guid.NewGuid(),
                Name = "team2",
                Address = "address",
            },
        };

        var result = await _adapter.ForUnselectedVenue(teamsWithSameAddress, _token);

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