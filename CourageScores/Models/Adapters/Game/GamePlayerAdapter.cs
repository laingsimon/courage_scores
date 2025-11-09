using CourageScores.Models.Adapters.Team;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class GamePlayerAdapter : IAdapter<GamePlayer, GamePlayerDto>
{
    public Task<GamePlayerDto> Adapt(GamePlayer model, CancellationToken token)
    {
        return Task.FromResult(new GamePlayerDto
        {
            Id = model.Id,
            Name = model.Name.TrimOrDefault(),
            Gender = model.Gender.ToGenderDto(),
        }.AddAuditProperties(model));
    }

    public Task<GamePlayer> Adapt(GamePlayerDto dto, CancellationToken token)
    {
        return Task.FromResult(new GamePlayer
        {
            Id = dto.Id,
            Name = dto.Name.TrimOrDefault(),
            Gender = dto.Gender.FromGenderDto(),
        }.AddAuditProperties(dto));
    }
}
