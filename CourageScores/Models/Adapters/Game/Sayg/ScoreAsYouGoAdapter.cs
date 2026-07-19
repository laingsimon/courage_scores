using CourageScores.Common;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Game.Sayg;

public class ScoreAsYouGoAdapter : ISimpleAdapter<ScoreAsYouGo, ScoreAsYouGoDto>
{
    private readonly ISimpleAdapter<Leg, LegDto> _legAdapter;

    public ScoreAsYouGoAdapter(ISimpleAdapter<Leg, LegDto> legAdapter)
    {
        _legAdapter = legAdapter;
    }

    public async Task<ScoreAsYouGoDto> Adapt(ScoreAsYouGo model, UserAccessContext context, CancellationToken token)
    {
        return new ScoreAsYouGoDto
        {
            Legs = await model.Legs.ToDictionaryAsync(key => key, value => _legAdapter.Adapt(value, context, token)),
        };
    }

    public async Task<ScoreAsYouGo> Adapt(ScoreAsYouGoDto dto, UserAccessContext context, CancellationToken token)
    {
        return new ScoreAsYouGo
        {
            Legs = await dto.Legs.ToDictionaryAsync(key => key, value => _legAdapter.Adapt(value, context, token)),
        };
    }
}
