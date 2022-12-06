using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game;

public class KnockoutGameAdapter : IAdapter<KnockoutGame, KnockoutGameDto>
{
    private readonly IAdapter<KnockoutRound, KnockoutRoundDto> _roundAdapter;
    private readonly IAdapter<KnockoutSide, KnockoutSideDto> _sideAdapter;

    public KnockoutGameAdapter(
        IAdapter<KnockoutRound, KnockoutRoundDto> roundAdapter,
        IAdapter<KnockoutSide, KnockoutSideDto> sideAdapter)
    {
        _roundAdapter = roundAdapter;
        _sideAdapter = sideAdapter;
    }

    public async Task<KnockoutGameDto> Adapt(KnockoutGame model)
    {
        return new KnockoutGameDto
        {
            Id = model.Id,
            Round = model.Round != null ? await _roundAdapter.Adapt(model.Round) : null,
            Date = model.Date,
            Sides = await model.Sides.SelectAsync(s => _sideAdapter.Adapt(s)).ToList(),
            SeasonId = model.SeasonId,
            Address = model.Address,
        }.AddAuditProperties(model);
    }

    public async Task<KnockoutGame> Adapt(KnockoutGameDto dto)
    {
        return new KnockoutGame
        {
            Id = dto.Id,
            Round = dto.Round != null ? await _roundAdapter.Adapt(dto.Round) : null,
            Date = dto.Date,
            Sides = await dto.Sides.SelectAsync(s => _sideAdapter.Adapt(s)).ToList(),
            SeasonId = dto.SeasonId,
            Address = dto.Address,
        }.AddAuditProperties(dto);
    }
}
