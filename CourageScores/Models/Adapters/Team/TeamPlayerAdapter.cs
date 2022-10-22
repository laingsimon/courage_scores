using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Team;

public class TeamPlayerAdapter : IAdapter<TeamPlayer, TeamPlayerDto>
{
    public TeamPlayerDto Adapt(TeamPlayer model)
    {
        return new TeamPlayerDto
        {
            Author = model.Author,
            Captain = model.Captain,
            Created = model.Created,
            Editor = model.Editor,
            Id = model.Id,
            Name = model.Name,
            Updated = model.Updated,
            PlayerId = model.PlayerId,
        };
    }

    public TeamPlayer Adapt(TeamPlayerDto dto)
    {
        return new TeamPlayer
        {
            Author = dto.Author,
            Captain = dto.Captain,
            Created = dto.Created,
            Editor = dto.Editor,
            Id = dto.Id,
            Name = dto.Name,
            Updated = dto.Updated,
            PlayerId = dto.PlayerId,
        };
    }
}