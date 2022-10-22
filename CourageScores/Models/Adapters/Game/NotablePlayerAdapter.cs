using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class NotablePlayerAdapter : IAdapter<NotablePlayer, NotablePlayerDto>
{
    public NotablePlayerDto Adapt(NotablePlayer model)
    {
        return new NotablePlayerDto
        {
            Author = model.Author,
            Created = model.Created,
            Editor = model.Editor,
            Id = model.Id,
            Name = model.Name,
            Notes = model.Notes,
            Updated = model.Updated,
        };
    }

    public NotablePlayer Adapt(NotablePlayerDto dto)
    {
        return new NotablePlayer
        {
            Author = dto.Author,
            Created = dto.Created,
            Editor = dto.Editor,
            Id = dto.Id,
            Name = dto.Name,
            Notes = dto.Notes,
            Updated = dto.Updated,
        };
    }
}