using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Models.Adapters.Game.Sayg;

public interface IUpdateRecordedScoreAsYouGoDtoAdapter
{
    Task<UpdateRecordedScoreAsYouGoDto> Adapt(RecordedScoreAsYouGoDto sayg, TournamentMatch match,
        GameMatchOption? matchOptions, CancellationToken token);
}