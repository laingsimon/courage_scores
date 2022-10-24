using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Team;

public class TeamPlayerAdapter : IAdapter<TeamPlayer, TeamPlayerDto>
{
    public TeamPlayerDto Adapt(TeamPlayer model)
    {
        return new TeamPlayerDto
        {
            Captain = model.Captain,
            Id = model.Id,
            Name = model.Name,
            PlayerId = model.PlayerId,
        }.AddAuditProperties(model);
    }

    public TeamPlayer Adapt(TeamPlayerDto dto)
    {
        return new TeamPlayer
        {
            Captain = dto.Captain,
            Id = dto.Id,
            Name = dto.Name,
            PlayerId = dto.PlayerId,
        };
    }
}