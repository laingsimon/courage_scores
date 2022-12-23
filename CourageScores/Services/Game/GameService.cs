using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos.Game;
using CourageScores.Repository;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Game;

public class GameService : GenericDataService<Models.Cosmos.Game.Game, GameDto>, IGameService
{
    public GameService(
        IGenericRepository<Models.Cosmos.Game.Game> repository,
        IAdapter<Models.Cosmos.Game.Game, GameDto> adapter,
        IUserService userService,
        IAuditingHelper auditingHelper)
        : base(repository, adapter, userService, auditingHelper)
    {
    }
}