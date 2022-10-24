using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class GamePlayerAdapter : IAdapter<GamePlayer, GamePlayerDto>
{
    public GamePlayerDto Adapt(GamePlayer model)
    {
        return new GamePlayerDto
        {
            Id = model.Id,
            Name = model.Name,
        }.AddAuditProperties(model);
    }

    public GamePlayer Adapt(GamePlayerDto dto)
    {
        return new GamePlayer
        {
            Id = dto.Id,
            Name = dto.Name,
        }.AddAuditProperties(dto);
    }
}