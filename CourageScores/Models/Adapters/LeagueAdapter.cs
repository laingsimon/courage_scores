using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public class LeagueAdapter : IAdapter<League, LeagueDto>
{
    private readonly IAdapter<Division, DivisionDto> _divisionAdapter;
    private readonly IAdapter<Season, SeasonDto> _seasonAdapter;

    public LeagueAdapter(
        IAdapter<Division, DivisionDto> divisionAdapter,
        IAdapter<Season, SeasonDto> seasonAdapter)
    {
        _divisionAdapter = divisionAdapter;
        _seasonAdapter = seasonAdapter;
    }

    public LeagueDto Adapt(League model)
    {
        return new LeagueDto
        {
            Author = model.Author,
            Created = model.Created,
            Divisions = model.Divisions.Select(_divisionAdapter.Adapt).ToArray(),
            Editor = model.Editor,
            Id = model.Id,
            Seasons = model.Seasons.Select(_seasonAdapter.Adapt).ToArray(),
            Updated = model.Updated,
        };
    }

    public League Adapt(LeagueDto dto)
    {
        return new League
        {
            Author = dto.Author,
            Created = dto.Created,
            Divisions = dto.Divisions.Select(_divisionAdapter.Adapt).ToArray(),
            Editor = dto.Editor,
            Id = dto.Id,
            Seasons = dto.Seasons.Select(_seasonAdapter.Adapt).ToArray(),
            Updated = dto.Updated,
        };
    }
}