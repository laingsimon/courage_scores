using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game;

public class TournamentSideAdapter : IAdapter<TournamentSide, TournamentSideDto>
{
    private readonly IAdapter<TournamentSidePlayer, TournamentSidePlayerDto> _playerAdapter;

    public TournamentSideAdapter(IAdapter<TournamentSidePlayer, TournamentSidePlayerDto> playerAdapter)
    {
        _playerAdapter = playerAdapter;
    }

    public async Task<TournamentSideDto> Adapt(TournamentSide model, CancellationToken token)
    {
        return new TournamentSideDto
        {
            Id = model.Id,
            Name = model.Name,
            TeamId = model.TeamId,
            Players = await model.Players.SelectAsync(p => _playerAdapter.Adapt(p, token)).ToList(),
        }.AddAuditProperties(model);
    }

    public async Task<TournamentSide> Adapt(TournamentSideDto dto, CancellationToken token)
    {
        return new TournamentSide
        {
            Id = dto.Id,
            Name = dto.Name?.Trim(),
            TeamId = dto.TeamId,
            Players = await dto.Players.SelectAsync(p => _playerAdapter.Adapt(p, token)).ToList(),
        }.AddAuditProperties(dto);
    }
}
