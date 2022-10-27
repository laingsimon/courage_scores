using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Team;

public class TeamSeasonAdapter : IAdapter<TeamSeason, TeamSeasonDto>
{
    private readonly IAdapter<TeamPlayer, TeamPlayerDto> _playerAdapter;

    public TeamSeasonAdapter(IAdapter<TeamPlayer, TeamPlayerDto> playerAdapter)
    {
        _playerAdapter = playerAdapter;
    }

    public TeamSeasonDto Adapt(TeamSeason model)
    {
        return new TeamSeasonDto
        {
            Id = model.Id,
            Players = model.Players.Select(_playerAdapter.Adapt).ToList(),
            SeasonId = model.SeasonId,
        }.AddAuditProperties(model);
    }

    public TeamSeason Adapt(TeamSeasonDto dto)
    {
        return new TeamSeason
        {
            Id = dto.Id,
            Players = dto.Players.Select(_playerAdapter.Adapt).ToList(),
            SeasonId = dto.SeasonId,
        }.AddAuditProperties(dto);
    }
}