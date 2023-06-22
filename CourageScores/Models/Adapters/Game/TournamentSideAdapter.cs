using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game;

public class TournamentSideAdapter : IAdapter<TournamentSide, TournamentSideDto>
{
    private readonly IAdapter<TournamentPlayer, TournamentPlayerDto> _playerAdapter;

    public TournamentSideAdapter(IAdapter<TournamentPlayer, TournamentPlayerDto> playerAdapter)
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
            NoShow = model.NoShow,
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
            NoShow = dto.NoShow,
        }.AddAuditProperties(dto);
    }
}
