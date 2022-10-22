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
            Author = model.Author,
            Created = model.Created,
            Editor = model.Editor,
            Id = model.Id,
            Players = model.Players.Select(_playerAdapter.Adapt).ToArray(),
            Updated = model.Updated,
            SeasonId = model.SeasonId,
        };
    }

    public TeamSeason Adapt(TeamSeasonDto dto)
    {
        return new TeamSeason
        {
            Author = dto.Author,
            Created = dto.Created,
            Editor = dto.Editor,
            Id = dto.Id,
            Players = dto.Players.Select(_playerAdapter.Adapt).ToArray(),
            Updated = dto.Updated,
            SeasonId = dto.SeasonId,
        };
    }
}