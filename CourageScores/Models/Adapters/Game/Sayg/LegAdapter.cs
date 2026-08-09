using CourageScores.Common;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Game.Sayg;

public class LegAdapter : ISimpleAdapter<Leg, LegDto>
{
    private readonly ISimpleAdapter<LegCompetitorScoreAdapterContext, LegCompetitorScoreDto> _legCompetitorScoreAdapter;
    private readonly ISimpleAdapter<LegPlayerSequence, LegPlayerSequenceDto> _playerSequenceAdapter;

    public LegAdapter(
        ISimpleAdapter<LegCompetitorScoreAdapterContext, LegCompetitorScoreDto> legCompetitorScoreAdapter,
        ISimpleAdapter<LegPlayerSequence, LegPlayerSequenceDto> playerSequenceAdapter)
    {
        _legCompetitorScoreAdapter = legCompetitorScoreAdapter;
        _playerSequenceAdapter = playerSequenceAdapter;
    }

    public async Task<LegDto> Adapt(Leg model, UserAccessContext context, CancellationToken token)
    {
        var homeAdapterContext = new LegCompetitorScoreAdapterContext(model.StartingScore, model.Home);
        var awayAdapterContext = new LegCompetitorScoreAdapterContext(model.StartingScore, model.Away);

        return new LegDto
        {
            Home = await _legCompetitorScoreAdapter.Adapt(homeAdapterContext, context, token),
            Away = await _legCompetitorScoreAdapter.Adapt(awayAdapterContext, context, token),
            StartingScore = model.StartingScore,
            PlayerSequence = await model.PlayerSequence.SelectAsync(ps => _playerSequenceAdapter.Adapt(ps, context, token)).ToList(),
            CurrentThrow = model.CurrentThrow?.ToString().ToLower(),
        };
    }

    public async Task<Leg> Adapt(LegDto dto, UserAccessContext context, CancellationToken token)
    {
        return new Leg
        {
            Home = (await _legCompetitorScoreAdapter.Adapt(dto.Home, context, token)).Score,
            Away = (await _legCompetitorScoreAdapter.Adapt(dto.Away, context, token)).Score,
            StartingScore = dto.StartingScore,
            PlayerSequence = await dto.PlayerSequence.SelectAsync(ps => _playerSequenceAdapter.Adapt(ps, context, token)).ToList(),
            CurrentThrow = dto.CurrentThrow != null ? Enum.Parse<CompetitorType>(dto.CurrentThrow, true) : null,
        };
    }
}
