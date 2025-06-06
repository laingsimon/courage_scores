﻿using CourageScores.Models.Adapters;
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
    private Mock<IAdapter<TournamentMatch,TournamentMatchDto>> _tournamentMatchAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _tournamentSideAdapter = new Mock<IAdapter<TournamentSide, TournamentSideDto>>();
        _tournamentTypeResolver = new Mock<ITournamentTypeResolver>();
        _tournamentMatchAdapter = new Mock<IAdapter<TournamentMatch, TournamentMatchDto>>();
        _adapter = new DivisionTournamentFixtureDetailsAdapter(_tournamentSideAdapter.Object, _tournamentTypeResolver.Object, _tournamentMatchAdapter.Object);

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
        Assert.That(result.SingleRound, Is.False);
        Assert.That(result.FirstRoundMatches, Is.Empty);
        Assert.That(result.Opponent, Is.Null);
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

    [TestCase(false, 3, 2, 1, "A")]
    [TestCase(false, 3, 1, 2, "B")]
    [TestCase(false, 5, 2, 1, null)]
    [TestCase(false, 5, 1, 2, null)]
    [TestCase(false, null, 2, 1, null)]
    [TestCase(false, null, 1, 2, null)]
    [TestCase(false, null, 3, 1, "A")]
    [TestCase(false, null, 1, 3, "B")]
    [TestCase(true, 3, 2, 1, null)]
    [TestCase(true, 3, 1, 2, null)]
    [TestCase(true, 5, 2, 1, null)]
    [TestCase(true, 5, 1, 2, null)]
    [TestCase(true, null, 2, 1, null)]
    [TestCase(true, null, 1, 2, null)]
    [TestCase(true, null, 3, 1, null)]
    [TestCase(true, null, 1, 3, null)]
    public async Task Adapt_GivenWinningRound_SetsPropertiesCorrectly(bool singleRound, int? bestOf, int scoreA, int scoreB, string? winnerName)
    {
        var sideA = new TournamentSideBuilder("A").Build();
        var sideB = new TournamentSideBuilder("B").Build();
        var game = new TournamentGameBuilder()
            .SingleRound(singleRound)
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
    public async Task Adapt_GivenNoSidesButSomeMatchesWithSelectedPlayers_ReturnsPlayersFromAnyMatch()
    {
        var sideA = new TournamentSideBuilder("A").WithPlayer("Player A").Build();
        var sideB = new TournamentSideBuilder("B").WithPlayer("Player B").Build();
        var game = new TournamentGameBuilder()
            .WithRound(r1 => r1.WithRound(r2 => r2
                .WithSide(sideA, sideB)
                .WithMatch(m => m.WithSides(sideA, sideB))
            ))
            .Build();

        var result = await _adapter.Adapt(game, _token);

        Assert.That(result.Players, Is.SupersetOf(sideA.Players.Select(p => p.Id)));
        Assert.That(result.Players, Is.SupersetOf(sideB.Players.Select(p => p.Id)));
    }

    [Test]
    public async Task Adapt_GivenSidesButNoMatches_ReturnsPlayersFromAnySide()
    {
        var sidePlayer = new TournamentPlayer
        {
            Id = Guid.NewGuid(),
            Name = "Side Player"
        };
        var game = new TournamentGameBuilder()
            .WithSides(new TournamentSide
            {
                Players = { sidePlayer },
            })
            .Build();

        var result = await _adapter.Adapt(game, _token);

        Assert.That(result.Players, Is.EquivalentTo([sidePlayer.Id]));
    }

    [Test]
    public async Task Adapt_GivenSidesAndMatchesWithDifferentPlayers_ReturnsSupersetOfPlayersFromSidesAndMatches()
    {
        var sidePlayer = new TournamentPlayer
        {
            Id = Guid.NewGuid(),
            Name = "Side Player"
        };
        var sideA = new TournamentSideBuilder("A").WithPlayer("Player A").Build();
        var sideB = new TournamentSideBuilder("B").WithPlayer("Player B").Build();
        var game = new TournamentGameBuilder()
            .WithRound(r1 => r1.WithRound(r2 => r2
                .WithSide(sideA, sideB)
                .WithMatch(m => m.WithSides(sideA, sideB))
                ))
            .WithSides(new TournamentSide
            {
                Players = { sidePlayer },
            })
            .Build();

        var result = await _adapter.Adapt(game, _token);

        Assert.That(result.Players, Has.Member(sidePlayer.Id));
        Assert.That(result.Players, Is.SupersetOf(sideA.Players.Select(p => p.Id)));
        Assert.That(result.Players, Is.SupersetOf(sideB.Players.Select(p => p.Id)));
    }

    [Test]
    public async Task Adapt_GivenSingleRound_SetsPropertiesCorrectly()
    {
        var sideA = new TournamentSideBuilder("A").Build();
        var sideB = new TournamentSideBuilder("B").Build();
        var matchDto = new TournamentMatchDto();
        var match = new TournamentMatch();
        var game = new TournamentGameBuilder()
            .SingleRound()
            .WithOpponent("OPPONENT")
            .WithRound(r1 => r1
                .WithSide(sideA, sideB)
                .WithMatch(match)
                .WithMatchOption(new GameMatchOption
                {
                    NumberOfLegs = 7,
                }))
            .Build();
        _tournamentMatchAdapter.Setup(a => a.Adapt(match, _token)).ReturnsAsync(matchDto);

        var result = await _adapter.Adapt(game, _token);

        Assert.That(result.SingleRound, Is.True);
        Assert.That(result.FirstRoundMatches, Is.EqualTo(new[] { matchDto }));
        Assert.That(result.Opponent, Is.EqualTo(game.Opponent));
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
        Assert.That(result.WinningSide, Is.Null);
    }
}