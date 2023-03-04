﻿using CourageScores.Filters;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services.Command;
using CourageScores.Tests.Models.Adapters;
using NUnit.Framework;
using NUnit.Framework.Constraints;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class UpdateTournamentRoundsCommandTests
{
    private UpdateTournamentRoundsCommand _command = null!;
    private TournamentGame _game = null!;
    private readonly CancellationToken _token = new CancellationToken();
    private TournamentRoundDto _update = null!;
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?> _matchOptionAdapter = null!;
    private GameMatchOption? _matchOption;
    private GameMatchOptionDto? _matchOptionDto;

    [SetUp]
    public void SetupEachTest()
    {
        var sideAdapter = new TournamentSideAdapter(new TournamentPlayerAdapter());
        _game = new TournamentGame();
        _update = new TournamentRoundDto();
        _cacheFlags = new ScopedCacheManagementFlags();
        _matchOption = new GameMatchOption();
        _matchOptionDto = new GameMatchOptionDto();
        _matchOptionAdapter = new MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?>(_matchOption, _matchOptionDto);
        _command = new UpdateTournamentRoundsCommand(
            sideAdapter,
            new TournamentMatchAdapter(sideAdapter),
            _cacheFlags,
            _matchOptionAdapter);
    }

    [Test]
    public async Task ApplyUpdate_WhenGameIsDeleted_ReturnsUnsuccessful()
    {
        _game.Deleted = new DateTime(2001, 02, 03);

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Cannot modify a deleted tournament game"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_WhenGameHasNoRound_AddsRoundAndReturnsSuccessful()
    {
        _update.NextRound = new TournamentRoundDto();

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Tournament game updated"));
        Assert.That(result.Result!.Round, Is.Not.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
    }

    [Test]
    public async Task ApplyUpdate_WhenGameHasARound_UpdatesRoundAndReturnsSuccessful()
    {
        _game.Round = new TournamentRound();
        _update.NextRound = new TournamentRoundDto();

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Tournament game updated"));
        Assert.That(result.Result!.Round, Is.Not.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
    }

    [Test]
    public async Task ApplyUpdate_WhenUpdateHasNestedRounds_UpdatesNestedRoundsAndReturnsSuccessful()
    {
        _game.Round = new TournamentRound();
        var side1 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 1",
            Players =
            {
                new TournamentPlayerDto
                {
                    Name = "Player",
                    Id = Guid.NewGuid(),
                    DivisionId = Guid.NewGuid(),
                }
            }
        };
        var side2 = new TournamentSideDto
        {
            Id = Guid.NewGuid(),
            Name = "Side 2",
            Players =
            {
                new TournamentPlayerDto
                {
                    Name = "Player",
                    Id = Guid.NewGuid(),
                    DivisionId = Guid.NewGuid(),
                }
            }
        };
        var round3 = new TournamentRoundDto
        {
            Name = "Round 3",
        };
        var round2 = new TournamentRoundDto
        {
            Name = "Round 2",
            NextRound = round3,
            Sides =
            {
                side1, side2
            },
            Matches =
            {
                new TournamentMatchDto
                {
                    SideA = side1,
                    SideB = side1,
                    ScoreA = 1,
                    ScoreB = 2,
                    Id = Guid.NewGuid(),
                }
            },
            MatchOptions =
            {
                _matchOptionDto,
            }
        };
        _update.NextRound = round2;
        _update.Name = "Round 1";

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Tournament game updated"));
        Assert.That(result.Result!.Round, new RoundComparisonConstraint(_update));
        Assert.That(result.Result!.Round!.NextRound, new RoundComparisonConstraint(round2));
        Assert.That(result.Result!.Round!.NextRound!.NextRound, new RoundComparisonConstraint(round3));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
    }

    private class RoundComparisonConstraint : IConstraint
    {
        private readonly TournamentRoundDto? _update;

        public RoundComparisonConstraint(TournamentRoundDto? update)
        {
            _update = update;
        }

        public IConstraint Resolve()
        {
            return this;
        }

        public ConstraintResult ApplyTo<TActual>(TActual actual)
        {
            if (_update == null && actual == null)
            {
                return new ConstraintResult(this, actual, ConstraintStatus.Success);
            }

            if (_update == null && actual != null)
            {
                return new ConstraintResult(this, actual, ConstraintStatus.Failure);
            }

            if (_update != null && actual == null)
            {
                return new ConstraintResult(this, actual, ConstraintStatus.Failure);
            }

            return new ConstraintResult(this, actual, IsEqual(actual as TournamentRound, _update!) ? ConstraintStatus.Success : ConstraintStatus.Failure);
        }

        private static bool IsEqual(TournamentRound? actual, TournamentRoundDto update)
        {
            if (actual == null)
            {
                throw new InvalidOperationException("Actual value isn't a TournamentRound");
            }

            return actual.Name == update.Name
                && IsEqual(actual.Sides, update.Sides)
                && IsEqual(actual.Matches, update.Matches)
                && (actual.NextRound == null) == (update.NextRound == null)
                && IsEqual(actual.MatchOptions, update.MatchOptions);
        }

        private static bool IsEqual(IReadOnlyCollection<TournamentSide> sides, IReadOnlyCollection<TournamentSideDto> updateSides)
        {
            return sides.Count == updateSides.Count
                && sides.Zip(updateSides, IsEqual).All(doesMatch => doesMatch);
        }

        private static bool IsEqual(TournamentSide side, TournamentSideDto updateSide)
        {
            return side.Id == updateSide.Id
                   && side.Name == updateSide.Name
                   && IsEqual(side.Players, updateSide.Players);
        }

        private static bool IsEqual(IReadOnlyCollection<GameMatchOption?> matchOptions, IReadOnlyCollection<GameMatchOptionDto?> updateMatchOptions)
        {
            return matchOptions.Count == updateMatchOptions.Count
                   && matchOptions.Zip(updateMatchOptions, IsEqual).All(doesMatch => doesMatch);
        }

        private static bool IsEqual(GameMatchOption? matchOption, GameMatchOptionDto? updateMatchOption)
        {
            return matchOption?.PlayerCount == updateMatchOption?.PlayerCount
                   && matchOption?.StartingScore == updateMatchOption?.StartingScore
                   && matchOption?.NumberOfLegs == updateMatchOption?.NumberOfLegs;
        }

        private static bool IsEqual(IReadOnlyCollection<TournamentPlayer> players, IReadOnlyCollection<TournamentPlayerDto> updatePlayers)
        {
            return players.Count == updatePlayers.Count
                   && players.Zip(updatePlayers, IsEqual).All(doesMatch => doesMatch);
        }

        private static bool IsEqual(TournamentPlayer player, TournamentPlayerDto updatePlayer)
        {
            return player.Id == updatePlayer.Id
                   && player.Name == updatePlayer.Name
                   && player.DivisionId == updatePlayer.DivisionId;
        }

        private static bool IsEqual(IReadOnlyCollection<TournamentMatch> matches, IReadOnlyCollection<TournamentMatchDto> updateMatches)
        {
            return matches.Count == updateMatches.Count
                   && matches.Zip(updateMatches, IsEqual).All(doesMatch => doesMatch);
        }

        private static bool IsEqual(TournamentMatch match, TournamentMatchDto updateMatch)
        {
            return match.ScoreA == updateMatch.ScoreA
                   && match.ScoreB == updateMatch.ScoreB
                   && IsEqual(match.SideA, updateMatch.SideA)
                   && IsEqual(match.SideB, updateMatch.SideB);
        }

        public ConstraintResult ApplyTo<TActual>(ActualValueDelegate<TActual> del)
        {
            return ApplyTo(del());
        }

        public ConstraintResult ApplyTo<TActual>(ref TActual actual)
        {
            return ApplyTo(actual);
        }

        public string DisplayName { get; set; } = "??";
        public string Description { get; set; } = "??";
        public object[] Arguments { get; set; } = Array.Empty<object>();
        public ConstraintBuilder Builder { get; set; } = new ConstraintBuilder();
    }
}