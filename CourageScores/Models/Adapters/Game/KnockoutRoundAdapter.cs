using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game;

public class KnockoutRoundAdapter : IAdapter<KnockoutRound, KnockoutRoundDto>
{
    private readonly IAdapter<KnockoutMatch, KnockoutMatchDto> _matchAdapter;
    private readonly IAdapter<KnockoutSide, KnockoutSideDto> _sideAdapter;

    public KnockoutRoundAdapter(
        IAdapter<KnockoutMatch, KnockoutMatchDto> matchAdapter,
        IAdapter<KnockoutSide, KnockoutSideDto> sideAdapter)
    {
        _matchAdapter = matchAdapter;
        _sideAdapter = sideAdapter;
    }

    public async Task<KnockoutRoundDto> Adapt(KnockoutRound model)
    {
        return new KnockoutRoundDto
        {
            Id = model.Id,
            Matches = await model.Matches.SelectAsync(m => _matchAdapter.Adapt(m)).ToList(),
            Sides = await model.Sides.SelectAsync(s => _sideAdapter.Adapt(s)).ToList(),
            NextRound = model.NextRound != null ? await Adapt(model.NextRound) : null,
            Name = model.Name,
        }.AddAuditProperties(model);
    }

    public async Task<KnockoutRound> Adapt(KnockoutRoundDto dto)
    {
        return new KnockoutRound
        {
            Id = dto.Id,
            Matches = await dto.Matches.SelectAsync(m => _matchAdapter.Adapt(m)).ToList(),
            Sides = await dto.Sides.SelectAsync(s => _sideAdapter.Adapt(s)).ToList(),
            NextRound = dto.NextRound != null ? await Adapt(dto.NextRound) : null,
            Name = dto.Name,
        }.AddAuditProperties(dto);
    }
}