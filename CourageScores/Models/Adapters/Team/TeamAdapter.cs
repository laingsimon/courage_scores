using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Team;

public class TeamAdapter : IAdapter<Cosmos.Team.Team, TeamDto>
{
    private readonly IAdapter<TeamSeason, TeamSeasonDto> _seasonAdapter;

    public TeamAdapter(IAdapter<TeamSeason, TeamSeasonDto> seasonAdapter)
    {
        _seasonAdapter = seasonAdapter;
    }

    public async Task<TeamDto> Adapt(Cosmos.Team.Team model, CancellationToken token)
    {
        return new TeamDto
        {
            Address = model.Address,
            Id = model.Id,
            Name = model.Name,
            Seasons = await model.Seasons.SelectAsync(season => _seasonAdapter.Adapt(season, token)).ToList(),
            DivisionId = model.DivisionId,
        }.AddAuditProperties(model);
    }

    public async Task<Cosmos.Team.Team> Adapt(TeamDto dto, CancellationToken token)
    {
        return new Cosmos.Team.Team
        {
            Address = dto.Address.Trim(),
            Id = dto.Id,
            Name = dto.Name.Trim(),
            Seasons = await dto.Seasons.SelectAsync(season => _seasonAdapter.Adapt(season, token)).ToList(),
            DivisionId = dto.DivisionId,
        }.AddAuditProperties(dto);
    }
}