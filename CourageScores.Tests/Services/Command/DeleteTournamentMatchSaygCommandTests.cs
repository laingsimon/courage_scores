using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services;
using CourageScores.Services.Command;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class DeleteTournamentMatchSaygCommandTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>> _saygService = null!;
    private DeleteTournamentMatchSaygCommand _command = null!;
    private TournamentGame _tournament = null!;
    private TournamentMatch _match = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _saygService = new Mock<IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>>();
        _command = new DeleteTournamentMatchSaygCommand(_saygService.Object);

        _match = new TournamentMatch
        {
            Id = Guid.NewGuid(),
            SaygId = Guid.NewGuid(),
        };
        _tournament = new TournamentGame
        {
            Round = new TournamentRound
            {
                Matches =
                {
                    _match,
                },
            },
        };
    }

    [Test]
    public async Task ApplyUpdate_WithNoRounds_ReturnsUnsuccessful()
    {
        _tournament.Round = null;

        var result = await _command.FromMatch(_match.Id).ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Match not found",
        }));
    }

    [Test]
    public async Task ApplyUpdate_WithUnknownMatchId_ReturnsUnsuccessful()
    {
        var result = await _command.FromMatch(Guid.NewGuid()).ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "Match not found",
        }));
    }

    [Test]
    public async Task ApplyUpdate_WithNoSaygIdForMatch_ReturnsUnsuccessful()
    {
        _match.SaygId = null;

        var result = await _command.FromMatch(_match.Id).ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "Match does not have a sayg id",
        }));
    }

    [Test]
    public async Task ApplyUpdate_WhenUnableToDeleteSayg_ReturnsUnsuccessful()
    {
        _saygService.Setup(s => s.Delete(_match.SaygId!.Value, _token))
            .ReturnsAsync(new ActionResultDto<RecordedScoreAsYouGoDto>
            {
                Success = false,
                Errors =
                {
                    "SOME ERROR",
                },
            });

        var result = await _command.FromMatch(_match.Id).ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "SOME ERROR",
        }));
    }

    [Test]
    public async Task ApplyUpdate_WhenAbleToDeleteSayg_UnsetsMatchSaygId()
    {
        _saygService.Setup(s => s.Delete(_match.SaygId!.Value, _token))
            .ReturnsAsync(new ActionResultDto<RecordedScoreAsYouGoDto>
            {
                Success = true,
                Messages =
                {
                    "SAYG DELETED",
                },
            });

        var result = await _command.FromMatch(_match.Id).ApplyUpdate(_tournament, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(new[]
        {
            "Sayg deleted and removed from match",
            "SAYG DELETED",
        }));
    }
}