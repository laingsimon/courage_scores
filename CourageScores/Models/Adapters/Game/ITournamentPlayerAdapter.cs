using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public interface ITournamentPlayerAdapter : IAdapter<TournamentPlayer, TournamentPlayerDto>
{
    Task<TournamentPlayer> Adapt(EditTournamentGameDto.RecordTournamentScoresPlayerDto player,
        CancellationToken token);
}