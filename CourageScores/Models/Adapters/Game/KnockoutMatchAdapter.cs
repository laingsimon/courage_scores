using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class KnockoutMatchAdapter : IAdapter<KnockoutMatch, KnockoutMatchDto>
{
    private readonly IAdapter<KnockoutSide, KnockoutSideDto> _knockoutSideAdapter;

    public KnockoutMatchAdapter(IAdapter<KnockoutSide, KnockoutSideDto> knockoutSideAdapter)
    {
        _knockoutSideAdapter = knockoutSideAdapter;
    }

    public async Task<KnockoutMatchDto> Adapt(KnockoutMatch model)
    {
        return new KnockoutMatchDto
        {
            Id = model.Id,
            ScoreA = model.ScoreA,
            ScoreB = model.ScoreB,
            SideA = await _knockoutSideAdapter.Adapt(model.SideA),
            SideB = await _knockoutSideAdapter.Adapt(model.SideB),
        }.AddAuditProperties(model);
    }

    public async Task<KnockoutMatch> Adapt(KnockoutMatchDto dto)
    {
        return new KnockoutMatch
        {
            Id = dto.Id,
            ScoreA = dto.ScoreA,
            ScoreB = dto.ScoreB,
            SideA = await _knockoutSideAdapter.Adapt(dto.SideA),
            SideB = await _knockoutSideAdapter.Adapt(dto.SideB),
        }.AddAuditProperties(dto);
    }
}