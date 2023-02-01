using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class TournamentSidePlayerAdapter : IAdapter<TournamentSidePlayer, TournamentSidePlayerDto>
{
    public Task<TournamentSidePlayerDto> Adapt(TournamentSidePlayer model, CancellationToken token)
    {
        return Task.FromResult(new TournamentSidePlayerDto
        {
            Id = model.Id,
            Name = model.Name,
            DivisionId = model.DivisionId,
        }.AddAuditProperties(model));
    }

    public Task<TournamentSidePlayer> Adapt(TournamentSidePlayerDto dto, CancellationToken token)
    {
        return Task.FromResult(new TournamentSidePlayer
        {
            Id = dto.Id,
            Name = dto.Name.Trim(),
            DivisionId = dto.DivisionId,
        }.AddAuditProperties(dto));
    }
}