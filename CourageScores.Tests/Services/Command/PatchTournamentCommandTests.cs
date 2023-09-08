using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services.Command;
using CourageScores.Tests.Models.Adapters;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class PatchTournamentCommandTests
{
    private readonly CancellationToken _token = new();
    private readonly TournamentPlayer _oneEightyPlayer = new();
    private readonly NotableTournamentPlayer _hiCheckPlayer = new();

    private PatchTournamentCommand _command = null!;
    private TournamentGame _tournament = null!;
    private PatchTournamentDto _patch = null!;
    private IAdapter<TournamentPlayer, TournamentPlayerDto> _oneEightyPlayerAdapter = null!;
    private TournamentPlayerDto _oneEightyPlayerDto = null!;
    private NotableTournamentPlayerDto _hiCheckPlayerDto = null!;
    private IAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto> _hiCheckPlayerAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _tournament = new TournamentGame();
        _patch = new PatchTournamentDto();
        _oneEightyPlayerDto = new TournamentPlayerDto();
        _hiCheckPlayerDto = new NotableTournamentPlayerDto();
        _oneEightyPlayerAdapter = new MockAdapter<TournamentPlayer, TournamentPlayerDto>(_oneEightyPlayer, _oneEightyPlayerDto);
        _hiCheckPlayerAdapter = new MockAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto>(_hiCheckPlayer, _hiCheckPlayerDto);
        _command = new PatchTournamentCommand(_oneEightyPlayerAdapter, _hiCheckPlayerAdapter);
    }

    [Test]
    public async Task ApplyUpdates_GivenNothingToPatch_ReturnsUnsuccessful()
    {
        var result = await _command
            .WithPatch(_patch)
            .ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "No tournament data to update",
        }));
        Assert.That(result.Result, Is.EqualTo(_tournament));
    }

    [Test]
    public async Task ApplyUpdates_GivenNoRound_ReturnsUnsuccessful()
    {
        _patch.Round = new PatchTournamentRoundDto();

        var result = await _command
            .WithPatch(_patch)
            .ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Round doesn't exist",
        }));
        Assert.That(result.Result, Is.EqualTo(_tournament));
    }

    [Test]
    public async Task ApplyUpdates_GivenNoNestedRound_ReturnsUnsuccessful()
    {
        _patch.Round = new PatchTournamentRoundDto
        {
            NextRound = new PatchTournamentRoundDto(),
        };
        _tournament.Round = new TournamentRound();

        var result = await _command
            .WithPatch(_patch)
            .ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Round doesn't exist",
        }));
        Assert.That(result.Result, Is.EqualTo(_tournament));
    }

    [Test]
    public async Task ApplyUpdates_GivenNoRoundDataToUpdate_ReturnsUnsuccessful()
    {
        _patch.Round = new PatchTournamentRoundDto();
        _tournament.Round = new TournamentRound();

        var result = await _command
            .WithPatch(_patch)
            .ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "No round details to update",
        }));
        Assert.That(result.Result, Is.EqualTo(_tournament));
    }

    [Test]
    public async Task ApplyUpdates_GivenMatchDataToUpdate_ReturnsSuccessful()
    {
        var match = new TournamentMatch
        {
            SideA = new TournamentSide
            {
                Id = Guid.NewGuid(),
            },
            SideB = new TournamentSide
            {
                Id = Guid.NewGuid(),
            },
        };
        _patch.Round = new PatchTournamentRoundDto
        {
            Match = new PatchTournamentMatchDto
            {
                SideA = match.SideA.Id,
                SideB = match.SideB.Id,
                ScoreA = 1,
                ScoreB = 2,
            },
        };
        _tournament.Round = new TournamentRound
        {
            Matches =
            {
                match,
            },
        };

        var result = await _command
            .WithPatch(_patch)
            .ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Match updated",
        }));
        Assert.That(result.Result, Is.EqualTo(_tournament));
        Assert.That(match.ScoreA, Is.EqualTo(1));
        Assert.That(match.ScoreB, Is.EqualTo(2));
    }

    [Test]
    public async Task ApplyUpdates_GivenNoMatchScoresToUpdate_ReturnsUnsuccessful()
    {
        var match = new TournamentMatch
        {
            SideA = new TournamentSide
            {
                Id = Guid.NewGuid(),
            },
            SideB = new TournamentSide
            {
                Id = Guid.NewGuid(),
            },
        };
        _patch.Round = new PatchTournamentRoundDto
        {
            Match = new PatchTournamentMatchDto
            {
                SideA = match.SideA.Id,
                SideB = match.SideB.Id,
            },
        };
        _tournament.Round = new TournamentRound
        {
            Matches =
            {
                match,
            },
        };

        var result = await _command
            .WithPatch(_patch)
            .ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "No match details to update",
        }));
        Assert.That(result.Result, Is.EqualTo(_tournament));
    }

    [Test]
    public async Task ApplyUpdates_GivenMatchNotFound_ReturnsUnsuccessful()
    {
        var match = new TournamentMatch
        {
            SideA = new TournamentSide
            {
                Id = Guid.NewGuid(),
            },
            SideB = new TournamentSide
            {
                Id = Guid.NewGuid(),
            },
        };
        _patch.Round = new PatchTournamentRoundDto
        {
            Match = new PatchTournamentMatchDto
            {
                SideA = Guid.NewGuid(),
                SideB = Guid.NewGuid(),
                ScoreA = 1,
                ScoreB = 2,
            },
        };
        _tournament.Round = new TournamentRound
        {
            Matches =
            {
                match,
            },
        };

        var result = await _command
            .WithPatch(_patch)
            .ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Match not found",
        }));
        Assert.That(result.Result, Is.EqualTo(_tournament));
    }

    [Test]
    public async Task ApplyUpdates_GivenAdditional180_ReturnsSuccess()
    {
        _patch.Additional180 = _oneEightyPlayerDto;

        var result = await _command
            .WithPatch(_patch)
            .ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.EqualTo(_tournament));
        Assert.That(_tournament.OneEighties, Is.EquivalentTo(new[]
        {
            _oneEightyPlayer,
        }));
    }

    [Test]
    public async Task ApplyUpdates_GivenAdditionalHiCheck_ReturnsSuccess()
    {
        _patch.AdditionalOver100Checkout = _hiCheckPlayerDto;

        var result = await _command
            .WithPatch(_patch)
            .ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.EqualTo(_tournament));
        Assert.That(_tournament.Over100Checkouts, Is.EquivalentTo(new[]
        {
            _hiCheckPlayer,
        }));
    }
}