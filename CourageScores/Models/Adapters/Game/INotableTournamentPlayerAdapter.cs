using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public interface INotableTournamentPlayerAdapter : IAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto>
{
    Task<NotableTournamentPlayer> Adapt(EditTournamentGameDto.TournamentOver100CheckoutDto player, CancellationToken token);
}