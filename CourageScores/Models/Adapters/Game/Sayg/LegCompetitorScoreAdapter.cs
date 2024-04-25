using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game.Sayg;

public class LegCompetitorScoreAdapter : ISimpleAdapter<LegCompetitorScoreAdapterContext, LegCompetitorScoreDto>
{
    private readonly ISimpleAdapter<LegThrow, LegThrowDto> _throwAdapter;

    public LegCompetitorScoreAdapter(ISimpleAdapter<LegThrow, LegThrowDto> throwAdapter)
    {
        _throwAdapter = throwAdapter;
    }

    public async Task<LegCompetitorScoreDto> Adapt(LegCompetitorScoreAdapterContext model, CancellationToken token)
    {
        return new LegCompetitorScoreDto
        {
            Score = GetScore(model.StartingScore, model.Score.Throws),
            Throws = await model.Score.Throws.SelectAsync(t => _throwAdapter.Adapt(t, token)).ToList(),
            NoOfDarts = model.Score.Throws.Sum(t => t.NoOfDarts),
        };
    }

    public async Task<LegCompetitorScoreAdapterContext> Adapt(LegCompetitorScoreDto dto, CancellationToken token)
    {
        return new LegCompetitorScoreAdapterContext(
            0,
            new LegCompetitorScore
            {
                Throws = await dto.Throws.SelectAsync(t => _throwAdapter.Adapt(t, token)).ToList(),
            });
    }

    private static int GetScore(int startingScore, IEnumerable<LegThrow> throws)
    {
        var score = 0;

        foreach (var legThrow in throws)
        {
            var newScore = score + legThrow.Score;

            if (newScore <= startingScore && newScore != startingScore - 1)
            {
                score = newScore;
            }
        }

        return score;
    }
}