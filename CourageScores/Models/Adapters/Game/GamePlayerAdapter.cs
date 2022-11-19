using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class GamePlayerAdapter : IAdapter<GamePlayer, GamePlayerDto>
{
    public Task<GamePlayerDto> Adapt(GamePlayer model)
    {
        return Task.FromResult(new GamePlayerDto
        {
            Id = model.Id,
            Name = model.Name,
        }.AddAuditProperties(model));
    }

    public Task<GamePlayer> Adapt(GamePlayerDto dto)
    {
        return Task.FromResult(new GamePlayer
        {
            Id = dto.Id,
            Name = dto.Name.Trim(),
        }.AddAuditProperties(dto));
    }
}