using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game;

public class TournamentSideAdapter : IAdapter<TournamentSide, TournamentSideDto>
{
    private readonly IAdapter<GamePlayer, GamePlayerDto> _gamePlayerAdapter;

    public TournamentSideAdapter(IAdapter<GamePlayer, GamePlayerDto> gamePlayerAdapter)
    {
        _gamePlayerAdapter = gamePlayerAdapter;
    }

    public async Task<TournamentSideDto> Adapt(TournamentSide model)
    {
        return new TournamentSideDto
        {
            Id = model.Id,
            Name = model.Name,
            Players = await model.Players.SelectAsync(p => _gamePlayerAdapter.Adapt(p)).ToList(),
        }.AddAuditProperties(model);
    }

    public async Task<TournamentSide> Adapt(TournamentSideDto dto)
    {
        return new TournamentSide
        {
            Id = dto.Id,
            Name = dto.Name,
            Players = await dto.Players.SelectAsync(p => _gamePlayerAdapter.Adapt(p)).ToList(),
        }.AddAuditProperties(dto);
    }
}