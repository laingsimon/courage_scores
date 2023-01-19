using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;

namespace CourageScores.Models.Adapters;

public class SeasonAdapter : IAdapter<Season, SeasonDto>
{
    private readonly IAdapter<Cosmos.Division, DivisionDto> _divisionAdapter;

    public SeasonAdapter(IAdapter<Cosmos.Division, DivisionDto> divisionAdapter)
    {
        _divisionAdapter = divisionAdapter;
    }

    public async Task<SeasonDto> Adapt(Season model, CancellationToken token)
    {
        return new SeasonDto
        {
            Divisions = await model.Divisions.SelectAsync(division => _divisionAdapter.Adapt(division, token)).ToList(),
            Id = model.Id,
            EndDate = model.EndDate,
            StartDate = model.StartDate,
            Name = model.Name,
        }.AddAuditProperties(model);
    }

    public async Task<Season> Adapt(SeasonDto dto, CancellationToken token)
    {
        return new Season
        {
            Divisions = await dto.Divisions.SelectAsync(division => _divisionAdapter.Adapt(division, token)).ToList(),
            Id = dto.Id,
            EndDate = dto.EndDate,
            StartDate = dto.StartDate,
            Name = dto.Name.Trim(),
        }.AddAuditProperties(dto);
    }
}