using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game;

public class KnockoutSideAdapter : IAdapter<KnockoutSide, KnockoutSideDto>
{
    private readonly IAdapter<GamePlayer, GamePlayerDto> _gamePlayerAdapter;

    public KnockoutSideAdapter(IAdapter<GamePlayer, GamePlayerDto> gamePlayerAdapter)
    {
        _gamePlayerAdapter = gamePlayerAdapter;
    }

    public async Task<KnockoutSideDto> Adapt(KnockoutSide model)
    {
        return new KnockoutSideDto
        {
            Id = model.Id,
            Name = model.Name,
            Players = await model.Players.SelectAsync(p => _gamePlayerAdapter.Adapt(p)).ToList(),
        }.AddAuditProperties(model);
    }

    public async Task<KnockoutSide> Adapt(KnockoutSideDto dto)
    {
        return new KnockoutSide
        {
            Id = dto.Id,
            Name = dto.Name,
            Players = await dto.Players.SelectAsync(p => _gamePlayerAdapter.Adapt(p)).ToList(),
        }.AddAuditProperties(dto);
    }
}