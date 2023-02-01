using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class NotableTournamentPlayerAdapter : IAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto>
{
    public Task<NotableTournamentPlayerDto> Adapt(NotableTournamentPlayer model, CancellationToken token)
    {
        return Task.FromResult(new NotableTournamentPlayerDto
        {
            Id = model.Id,
            Name = model.Name,
            Notes = model.Notes,
            DivisionId = model.DivisionId,
        }.AddAuditProperties(model));
    }

    public Task<NotableTournamentPlayer> Adapt(NotableTournamentPlayerDto dto, CancellationToken token)
    {
        return Task.FromResult(new NotableTournamentPlayer
        {
            Id = dto.Id,
            Name = dto.Name.Trim(),
            Notes = dto.Notes?.Trim(),
            DivisionId = dto.DivisionId,
        }.AddAuditProperties(dto));
    }
}