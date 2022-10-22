using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class GameTeamAdapter : IAdapter<GameTeam, GameTeamDto>
{
    public GameTeamDto Adapt(GameTeam model)
    {
        return new GameTeamDto
        {
            Author = model.Author,
            Created = model.Created,
            Editor = model.Editor,
            Id = model.Id,
            Name = model.Name,
            Updated = model.Updated,
            ManOfTheMatch = model.ManOfTheMatch,
        };
    }

    public GameTeam Adapt(GameTeamDto dto)
    {
        return new GameTeam
        {
            Author = dto.Author,
            Created = dto.Created,
            Editor = dto.Editor,
            Id = dto.Id,
            Name = dto.Name,
            Updated = dto.Updated,
            ManOfTheMatch = dto.ManOfTheMatch,
        };
    }
}