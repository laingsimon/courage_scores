using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Models.Adapters.Game.Sayg;

public class LegThrowAdapter : ISimpleAdapter<LegThrow, LegThrowDto>
{
    public Task<LegThrowDto> Adapt(LegThrow model, CancellationToken token)
    {
        return Task.FromResult(new LegThrowDto
        {
            Score = model.Score,
            NoOfDarts = model.NoOfDarts,
        });
    }

    public Task<LegThrow> Adapt(LegThrowDto dto, CancellationToken token)
    {
        return Task.FromResult(new LegThrow
        {
            Score = dto.Score,
            NoOfDarts = dto.NoOfDarts,
        });
    }
}