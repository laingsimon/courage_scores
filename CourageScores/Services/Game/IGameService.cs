using CourageScores.Models.Dtos.Game;

namespace CourageScores.Services.Game;

public interface IGameService : IGenericDataService<Models.Cosmos.Game.Game, GameDto>
{
}