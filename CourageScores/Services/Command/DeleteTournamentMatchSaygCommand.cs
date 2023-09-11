using CourageScores.Models;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Command;

public class DeleteTournamentMatchSaygCommand : IUpdateCommand<TournamentGame, TournamentGame>
{
    private readonly IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> _saygService;

    private Guid? _matchId;

    public DeleteTournamentMatchSaygCommand(IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> saygService)
    {
        _saygService = saygService;
    }

    public DeleteTournamentMatchSaygCommand FromMatch(Guid matchId)
    {
        _matchId = matchId;
        return this;
    }

    public async Task<ActionResult<TournamentGame>> ApplyUpdate(TournamentGame model, CancellationToken token)
    {
        if (_matchId == null)
        {
            throw new InvalidOperationException("FromMatch must be called first");
        }

        var match = FindMatchVisitor.FindMatch(model, _matchId.Value);
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
            match.SaygId = null;

            return new ActionResult<TournamentGame>
            {
                Success = true,
                Messages = result.Messages.Concat(new[]
                {
                    "Sayg deleted and removed from match",
                }).ToList(),
                Warnings = result.Warnings,
                Errors = result.Errors,
                Result = model,
            };
        }

        return new ActionResult<TournamentGame>
        {
            Success = false,
            Errors = result.Errors,
            Warnings = result.Warnings,
            Messages = result.Messages,
            Result = model,
        };
    }

}