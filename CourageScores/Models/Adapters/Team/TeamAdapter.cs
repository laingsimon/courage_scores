using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Team;

public class TeamAdapter : IAdapter<Cosmos.Team.Team, TeamDto>
{
    private readonly IAdapter<TeamSeason, TeamSeasonDto> _seasonAdapter;

    public TeamAdapter(IAdapter<TeamSeason, TeamSeasonDto> seasonAdapter)
    {
        _seasonAdapter = seasonAdapter;
    }

    public TeamDto Adapt(Cosmos.Team.Team model)
    {
        return new TeamDto
        {
            Address = model.Address,
            Author = model.Author,
            Created = model.Created,
            Editor = model.Editor,
            Id = model.Id,
            Name = model.Name,
            Seasons = model.Seasons.Select(_seasonAdapter.Adapt).ToArray(),
            Updated = model.Updated,
            DivisionId = model.DivisionId,
        };
    }

    public Cosmos.Team.Team Adapt(TeamDto dto)
    {
        return new Cosmos.Team.Team
        {
            Address = dto.Address,
            Author = dto.Author,
            Created = dto.Created,
            Editor = dto.Editor,
            Id = dto.Id,
            Name = dto.Name,
            Seasons = dto.Seasons.Select(_seasonAdapter.Adapt).ToArray(),
            Updated = dto.Updated,
            DivisionId = dto.DivisionId,
        };
    }
}