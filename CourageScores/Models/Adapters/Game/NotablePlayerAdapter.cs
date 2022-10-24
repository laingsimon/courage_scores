using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class NotablePlayerAdapter : IAdapter<NotablePlayer, NotablePlayerDto>
{
    public NotablePlayerDto Adapt(NotablePlayer model)
    {
        return new NotablePlayerDto
        {
            Id = model.Id,
            Name = model.Name,
            Notes = model.Notes,
        }.AddAuditProperties(model);
    }

    public NotablePlayer Adapt(NotablePlayerDto dto)
    {
        return new NotablePlayer
        {
            Id = dto.Id,
            Name = dto.Name,
            Notes = dto.Notes,
        }.AddAuditProperties(dto);
    }
}