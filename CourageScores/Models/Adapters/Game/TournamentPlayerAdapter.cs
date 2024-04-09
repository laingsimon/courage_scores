using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class TournamentPlayerAdapter : IAdapter<TournamentPlayer, TournamentPlayerDto>
{
    public Task<TournamentPlayerDto> Adapt(TournamentPlayer model, CancellationToken token)
    {
        return Task.FromResult(new TournamentPlayerDto
        {
            Id = model.Id,
            Name = model.Name,
            DivisionId = model.DivisionId,
        }.AddAuditProperties(model));
    }

    public Task<TournamentPlayer> Adapt(TournamentPlayerDto dto, CancellationToken token)
    {
        return Task.FromResult(new TournamentPlayer
        {
            Id = dto.Id,
            Name = dto.Name.Trim(),
            DivisionId = dto.DivisionId,
        }.AddAuditProperties(dto));
    }
}