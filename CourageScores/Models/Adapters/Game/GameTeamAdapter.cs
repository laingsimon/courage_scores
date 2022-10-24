using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class GameTeamAdapter : IAdapter<GameTeam, GameTeamDto>
{
    public GameTeamDto Adapt(GameTeam model)
    {
        return new GameTeamDto
        {
            Id = model.Id,
            Name = model.Name,
            ManOfTheMatch = model.ManOfTheMatch,
        }.AddAuditProperties(model);
    }

    public GameTeam Adapt(GameTeamDto dto)
    {
        return new GameTeam
        {
            Id = dto.Id,
            Name = dto.Name,
            ManOfTheMatch = dto.ManOfTheMatch,
        }.AddAuditProperties(dto);
    }
}