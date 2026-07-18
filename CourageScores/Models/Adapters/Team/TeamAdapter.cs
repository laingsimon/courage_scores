using CourageScores.Common;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Models.Adapters.Team;

public class TeamAdapter : IAdapter<Cosmos.Team.Team, TeamDto>
{
    private readonly IAdapter<TeamSeason, TeamSeasonDto> _seasonAdapter;

    public TeamAdapter(IAdapter<TeamSeason, TeamSeasonDto> seasonAdapter)
    {
        _seasonAdapter = seasonAdapter;
    }

    public async Task<TeamDto> Adapt(CosmosTeam model, UserAccessContext context, CancellationToken token)
    {
        return new TeamDto
        {
            Address = model.Address.TrimOrDefault(),
            Id = model.Id,
            Name = model.Name.TrimOrDefault(),
            Seasons = await model.Seasons.SelectAsync(season => _seasonAdapter.Adapt(season, context, token)).ToList(),
        }.AddAuditProperties(model);
    }

    public async Task<CosmosTeam> Adapt(TeamDto dto, UserAccessContext context, CancellationToken token)
    {
        return new CosmosTeam
        {
            Address = dto.Address.TrimOrDefault(),
            Id = dto.Id,
            Name = dto.Name.TrimOrDefault(),
            Seasons = await dto.Seasons.SelectAsync(season => _seasonAdapter.Adapt(season, context, token)).ToList(),
        }.AddAuditProperties(dto);
    }
}
