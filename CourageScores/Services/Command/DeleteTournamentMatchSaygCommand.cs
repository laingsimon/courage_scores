using CourageScores.Models;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Live;
using CourageScores.Services.Live;

namespace CourageScores.Services.Command;

public class DeleteTournamentMatchSaygCommand : IUpdateCommand<TournamentGame, TournamentGame>, IPublishingCommand<TournamentGame>
{
    private readonly IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> _saygService;
    private readonly IWebSocketMessageProcessor _processor;

    private Guid? _matchId;
    private bool _clearScores;

    public DeleteTournamentMatchSaygCommand(
        IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> saygService,
        IWebSocketMessageProcessor processor)
    {
        _saygService = saygService;
        _processor = processor;
    }

    public DeleteTournamentMatchSaygCommand FromMatch(Guid matchId)
    {
        _matchId = matchId;
        return this;
    }

    public DeleteTournamentMatchSaygCommand ClearingScores(bool clearScores)
    {
        _clearScores = clearScores;
        return this;
    }

    public async Task<ActionResult<TournamentGame>> ApplyUpdate(TournamentGame model, CancellationToken token)
    {
        _matchId.ThrowIfNull($"{nameof(FromMatch)} must be called first");

        var match = FindMatchVisitor.FindMatch(model, _matchId!.Value);
        if (match == null)
        {
            return new ActionResult<TournamentGame>
            {
                Success = false,
                Errors =
                {
                    "Match not found",
                },
                Result = model,
            };
        }

        if (match.SaygId == null)
        {
            return new ActionResult<TournamentGame>
            {
                Success = false,
                Warnings =
                {
                    "Match does not have a sayg id",
                },
                Result = model,
            };
        }

        var result = await _saygService.Delete(match.SaygId.Value, token);

        if (result.Success)
        {
            if (_clearScores)
            {
                match.ScoreA = 0;
                match.ScoreB = 0;
            }

            match.SaygId = null;

            return result.ToActionResult().As(model).Merge(new ActionResult<TournamentGame>
            {
                Success = true,
                Messages =
                {
                    _clearScores
                        ? "Sayg deleted and removed from match. Match scores reset"
                        : "Sayg deleted and removed from match"
                },
            });
        }

        return result.ToActionResult().As(model);
    }

    public async Task PublishUpdate(TournamentGame tournament, bool deleted, CancellationToken token)
    {
        if (!deleted)
        {
            await _processor.PublishUpdate(null, tournament.Id, LiveDataType.Tournament, tournament, token);
        }
    }
}
