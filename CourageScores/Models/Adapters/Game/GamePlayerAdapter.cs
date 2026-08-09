using CourageScores.Models.Adapters.Team;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Game;

public class GamePlayerAdapter : IAdapter<GamePlayer, GamePlayerDto>
{
    public Task<GamePlayerDto> Adapt(GamePlayer model, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new GamePlayerDto
        {
            Id = model.Id,
            Name = model.Name.TrimOrDefault(),
            Gender = model.Gender.ToGenderDto(),
        }.AddAuditProperties(model));
    }

    public Task<GamePlayer> Adapt(GamePlayerDto dto, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new GamePlayer
        {
            Id = dto.Id,
            Name = dto.Name.TrimOrDefault(),
            Gender = dto.Gender.FromGenderDto(),
        }.AddAuditProperties(dto));
    }
}
