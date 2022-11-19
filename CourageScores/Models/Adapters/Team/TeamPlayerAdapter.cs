using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Team;

public class TeamPlayerAdapter : IAdapter<TeamPlayer, TeamPlayerDto>
{
    public Task<TeamPlayerDto> Adapt(TeamPlayer model)
    {
        return Task.FromResult(new TeamPlayerDto
        {
            Captain = model.Captain,
            Id = model.Id,
            Name = model.Name,
        }.AddAuditProperties(model));
    }

    public Task<TeamPlayer> Adapt(TeamPlayerDto dto)
    {
        return Task.FromResult(new TeamPlayer
        {
            Captain = dto.Captain,
            Id = dto.Id,
            Name = dto.Name,
        }.AddAuditProperties(dto));
    }
}