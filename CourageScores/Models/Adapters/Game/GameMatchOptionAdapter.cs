using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class GameMatchOptionAdapter : ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?>
{
    public Task<GameMatchOptionDto?> Adapt(GameMatchOption? model, CancellationToken token)
    {
        if (model == null)
        {
            return Task.FromResult<GameMatchOptionDto?>(null);
        }

        return Task.FromResult<GameMatchOptionDto?>(new GameMatchOptionDto
        {
            StartingScore = model.StartingScore,
            NumberOfLegs = model.NumberOfLegs,
            PlayerCount = model.PlayerCount,
        });
    }

    public Task<GameMatchOption?> Adapt(GameMatchOptionDto? dto, CancellationToken token)
    {
        if (dto == null)
        {
            return Task.FromResult<GameMatchOption?>(null);
        }

        return Task.FromResult<GameMatchOption?>(new GameMatchOption
        {
            StartingScore = dto.StartingScore,
            NumberOfLegs = dto.NumberOfLegs,
            PlayerCount = dto.PlayerCount,
        });
    }
}