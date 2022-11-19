using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services;

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

    public async Task<LeagueDto> Adapt(League model)
    {
        return new LeagueDto
        {
            Divisions = await model.Divisions.SelectAsync(_divisionAdapter.Adapt).ToList(),
            Id = model.Id,
            Seasons = await model.Seasons.SelectAsync(_seasonAdapter.Adapt).ToList(),
        }.AddAuditProperties(model);
    }

    public async Task<League> Adapt(LeagueDto dto)
    {
        return new League
        {
            Divisions = await dto.Divisions.SelectAsync(_divisionAdapter.Adapt).ToList(),
            Id = dto.Id,
            Seasons = await dto.Seasons.SelectAsync(_seasonAdapter.Adapt).ToList(),
        }.AddAuditProperties(dto);
    }
}