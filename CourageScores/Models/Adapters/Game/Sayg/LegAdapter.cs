using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services;

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

    public async Task<LegDto> Adapt(Leg model, CancellationToken token)
    {
        var homeAdapterContext = new LegCompetitorScoreAdapterContext(model.StartingScore, model.Home);
        var awayAdapterContext = new LegCompetitorScoreAdapterContext(model.StartingScore, model.Away);

        return new LegDto
        {
            Home = await _legCompetitorScoreAdapter.Adapt(homeAdapterContext, token),
            Away = await _legCompetitorScoreAdapter.Adapt(awayAdapterContext, token),
            Winner = model.Winner?.ToString().ToLower(),
            StartingScore = model.StartingScore,
            PlayerSequence = await model.PlayerSequence.SelectAsync(ps => _playerSequenceAdapter.Adapt(ps, token)).ToList(),
        };
    }

    public async Task<Leg> Adapt(LegDto dto, CancellationToken token)
    {
        return new Leg
        {
            Home = (await _legCompetitorScoreAdapter.Adapt(dto.Home, token)).Score,
            Away = (await _legCompetitorScoreAdapter.Adapt(dto.Away, token)).Score,
            Winner = dto.Winner != null ? Enum.Parse<CompetitorType>(dto.Winner, true) : null,
            StartingScore = dto.StartingScore,
            PlayerSequence = await dto.PlayerSequence.SelectAsync(ps => _playerSequenceAdapter.Adapt(ps, token)).ToList(),
        };
    }
}