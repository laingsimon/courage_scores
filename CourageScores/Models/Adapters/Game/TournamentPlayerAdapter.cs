using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Game;

public class TournamentPlayerAdapter : IAdapter<TournamentPlayer, TournamentPlayerDto>
{
    public Task<TournamentPlayerDto> Adapt(TournamentPlayer model, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new TournamentPlayerDto
        {
            Id = model.Id,
            Name = model.Name.TrimOrDefault(),
            DivisionId = model.DivisionId,
        }.AddAuditProperties(model));
    }

    public Task<TournamentPlayer> Adapt(TournamentPlayerDto dto, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new TournamentPlayer
        {
            Id = dto.Id,
            Name = dto.Name.TrimOrDefault(),
            DivisionId = dto.DivisionId,
        }.AddAuditProperties(dto));
    }
}
