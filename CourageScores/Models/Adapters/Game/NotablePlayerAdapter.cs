using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class NotablePlayerAdapter : IAdapter<NotablePlayer, NotablePlayerDto>
{
    public Task<NotablePlayerDto> Adapt(NotablePlayer model, CancellationToken token)
    {
        return Task.FromResult(new NotablePlayerDto
        {
            Id = model.Id,
            Name = model.Name,
            Notes = model.Notes,
        }.AddAuditProperties(model));
    }

    public Task<NotablePlayer> Adapt(NotablePlayerDto dto, CancellationToken token)
    {
        return Task.FromResult(new NotablePlayer
        {
            Id = dto.Id,
            Name = dto.Name.Trim(),
            Notes = dto.Notes?.Trim(),
        }.AddAuditProperties(dto));
    }
}