using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class GameMatchOptionAdapter : ISimpleAdapter<GameMatchOption, GameMatchOptionDto>
{
    public Task<GameMatchOptionDto> Adapt(GameMatchOption model, CancellationToken token)
    {
        return Task.FromResult(new GameMatchOptionDto
        {
            StartingScore = model.StartingScore,
            NumberOfLegs = model.NumberOfLegs,
        });
    }

    public Task<GameMatchOption> Adapt(GameMatchOptionDto dto, CancellationToken token)
    {
        return Task.FromResult(new GameMatchOption
        {
            StartingScore = dto.StartingScore,
            NumberOfLegs = dto.NumberOfLegs,
        });
    }
}