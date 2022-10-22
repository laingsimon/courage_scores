using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class GamePlayerAdapter : IAdapter<GamePlayer, GamePlayerDto>
{
    public GamePlayerDto Adapt(GamePlayer model)
    {
        return new GamePlayerDto
        {
            Author = model.Author,
            Created = model.Created,
            Editor = model.Editor,
            Id = model.Id,
            Name = model.Name,
            Updated = model.Updated,
        };
    }

    public GamePlayer Adapt(GamePlayerDto dto)
    {
        return new GamePlayer
        {
            Author = dto.Author,
            Created = dto.Created,
            Editor = dto.Editor,
            Id = dto.Id,
            Name = dto.Name,
            Updated = dto.Updated,
        };
    }
}