using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Season;

public interface IUpdateScoresAdapter
{
    Task<GamePlayer> AdaptToPlayer(RecordScoresDto.RecordScoresGamePlayerDto player, CancellationToken token);
    Task<NotablePlayer> AdaptToHiCheckPlayer(RecordScoresDto.GameOver100CheckoutDto player, CancellationToken token);
    Task<GameMatch> AdaptToMatch(RecordScoresDto.RecordScoresGameMatchDto updatedMatch, UserAccessContext context, CancellationToken token);
    Task<GameMatch> UpdateMatch(GameMatch currentMatch, RecordScoresDto.RecordScoresGameMatchDto updatedMatch, UserAccessContext context, CancellationToken token);
}
