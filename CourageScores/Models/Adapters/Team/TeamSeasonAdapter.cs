using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Team;

public class TeamSeasonAdapter : IAdapter<TeamSeason, TeamSeasonDto>
{
    private readonly IAdapter<TeamPlayer, TeamPlayerDto> _playerAdapter;

    public TeamSeasonAdapter(IAdapter<TeamPlayer, TeamPlayerDto> playerAdapter)
    {
        _playerAdapter = playerAdapter;
    }

    public async Task<TeamSeasonDto> Adapt(TeamSeason model)
    {
        return new TeamSeasonDto
        {
            Id = model.Id,
            Players = await model.Players.Where(p => p.Deleted == null).SelectAsync(_playerAdapter.Adapt).ToList(),
            SeasonId = model.SeasonId,
        }.AddAuditProperties(model);
    }

    public async Task<TeamSeason> Adapt(TeamSeasonDto dto)
    {
        return new TeamSeason
        {
            Id = dto.Id,
            Players = await dto.Players.SelectAsync(_playerAdapter.Adapt).ToList(),
            SeasonId = dto.SeasonId,
        }.AddAuditProperties(dto);
    }
}