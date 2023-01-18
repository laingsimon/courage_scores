using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;

namespace CourageScores.Models.Adapters;

public class LeagueAdapter : IAdapter<League, LeagueDto>
{
    private readonly IAdapter<Cosmos.Division, DivisionDto> _divisionAdapter;
    private readonly IAdapter<Season, SeasonDto> _seasonAdapter;

    public LeagueAdapter(
        IAdapter<Cosmos.Division, DivisionDto> divisionAdapter,
        IAdapter<Season, SeasonDto> seasonAdapter)
    {
        _divisionAdapter = divisionAdapter;
        _seasonAdapter = seasonAdapter;
    }

    public async Task<LeagueDto> Adapt(League model, CancellationToken token)
    {
        return new LeagueDto
        {
            Name = model.Name,
            Divisions = await model.Divisions.SelectAsync(division => _divisionAdapter.Adapt(division, token)).ToList(),
            Id = model.Id,
            Seasons = await model.Seasons.SelectAsync(season => _seasonAdapter.Adapt(season, token)).ToList(),
        }.AddAuditProperties(model);
    }

    public async Task<League> Adapt(LeagueDto dto, CancellationToken token)
    {
        return new League
        {
            Name = dto.Name.Trim(),
            Divisions = await dto.Divisions.SelectAsync(division => _divisionAdapter.Adapt(division, token)).ToList(),
            Id = dto.Id,
            Seasons = await dto.Seasons.SelectAsync(season => _seasonAdapter.Adapt(season, token)).ToList(),
        }.AddAuditProperties(dto);
    }
}