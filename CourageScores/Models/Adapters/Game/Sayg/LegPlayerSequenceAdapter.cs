using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Models.Adapters.Game.Sayg;

public class LegPlayerSequenceAdapter : ISimpleAdapter<LegPlayerSequence, LegPlayerSequenceDto>
{
    public Task<LegPlayerSequenceDto> Adapt(LegPlayerSequence model, CancellationToken token)
    {
        return Task.FromResult(new LegPlayerSequenceDto
        {
            Value = model.Value.ToString().ToLower(),
            Text = model.Text,
        });
    }

    public Task<LegPlayerSequence> Adapt(LegPlayerSequenceDto dto, CancellationToken token)
    {
        return Task.FromResult(new LegPlayerSequence
        {
            Value = Enum.Parse<CompetitorType>(dto.Value, true),
            Text = dto.Text,
        });
    }
}