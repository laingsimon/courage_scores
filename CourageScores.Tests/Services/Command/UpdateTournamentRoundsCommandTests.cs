using CourageScores.Filters;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Command;
using CourageScores.Tests.Models.Adapters;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class UpdateTournamentRoundsCommandTests
{
    private static readonly ScoreAsYouGoDto ScoreAsYouGoDto = new ScoreAsYouGoDto();
    private UpdateTournamentRoundsCommand _command = null!;
    private TournamentGame _game = null!;
    private readonly CancellationToken _token = new CancellationToken();
    private TournamentRoundDto _update = null!;
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?> _matchOptionAdapter = null!;
    private GameMatchOption? _matchOption;
    private GameMatchOptionDto? _matchOptionDto;
    private MockAdapter<TournamentMatch,TournamentMatchDto> _matchAdapter = null!;
    private MockAdapter<TournamentSide,TournamentSideDto> _sideAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _sideAdapter = new MockAdapter<TournamentSide, TournamentSideDto>();
        _game = new TournamentGame();
        _update = new TournamentRoundDto();
        _cacheFlags = new ScopedCacheManagementFlags();
        _matchOption = new GameMatchOption();
        _matchOptionDto = new GameMatchOptionDto();
        _matchOptionAdapter = new MockSimpleAdapter<GameMatchOption?, GameMatchOptionDto?>(_matchOption, _matchOptionDto);
        _matchAdapter = new MockAdapter<TournamentMatch, TournamentMatchDto>();
        _command = new UpdateTournamentRoundsCommand(
            _sideAdapter,
            _matchAdapter,
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
        var side1Dto = new TournamentSideDto
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
        var side2Dto = new TournamentSideDto
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
        var matchDto = new TournamentMatchDto
        {
            SideA = side1Dto,
            SideB = side1Dto,
            ScoreA = 1,
            ScoreB = 2,
            Id = Guid.NewGuid(),
            Sayg = ScoreAsYouGoDto,
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
                side1Dto, side2Dto
            },
            Matches =
            {
                matchDto
            },
            MatchOptions =
            {
                _matchOptionDto,
            }
        };
        _update.NextRound = round2;
        _update.Name = "Round 1";
        _update.Sides.AddRange(new[] { side1Dto, side2Dto });
        var match = new TournamentMatch { Id = matchDto.Id };
        var side1 = new TournamentSide { Id = side1Dto.Id };
        var side2 = new TournamentSide { Id = side2Dto.Id };
        _matchAdapter.AddMapping(match, matchDto);
        _sideAdapter.AddMapping(side1, side1Dto);
        _sideAdapter.AddMapping(side2, side2Dto);

        var result = await _command.WithData(_update).ApplyUpdate(_game, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Tournament game updated"));
        var resultRound1 = result.Result!.Round;
        Assert.That(resultRound1, Is.Not.Null);
        Assert.That(resultRound1!.Name, Is.EqualTo("Round 1"));
        Assert.That(resultRound1.Matches, Is.Empty);
        Assert.That(resultRound1.Sides, Is.EqualTo(new[] { side1, side2 }));
        Assert.That(resultRound1.MatchOptions, Is.Empty);
        var resultRound2 = resultRound1.NextRound;
        Assert.That(resultRound2, Is.Not.Null);
        Assert.That(resultRound2!.Name, Is.EqualTo("Round 2"));
        Assert.That(resultRound2.Matches, Is.EqualTo(new[] { match }));
        Assert.That(resultRound2.Sides, Is.EqualTo(new[] { side1, side2 }));
        Assert.That(resultRound2.MatchOptions, Is.EqualTo(new[] { _matchOption }));
        var resultRound3 = resultRound2.NextRound;
        Assert.That(resultRound3, Is.Not.Null);
        Assert.That(resultRound3!.Name, Is.EqualTo("Round 3"));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(_game.SeasonId));
    }
}