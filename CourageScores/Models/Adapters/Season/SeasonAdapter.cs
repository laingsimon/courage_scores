using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Season;

public class SeasonAdapter : IAdapter<Cosmos.Season.Season, SeasonDto>
{
    private readonly TimeProvider _clock;
    private readonly IAdapter<Cosmos.Division, DivisionDto> _divisionAdapter;

    public SeasonAdapter(IAdapter<Cosmos.Division, DivisionDto> divisionAdapter, TimeProvider clock)
    {
        _divisionAdapter = divisionAdapter;
        _clock = clock;
    }

    public async Task<SeasonDto> Adapt(Cosmos.Season.Season model, CancellationToken token)
    {
        var now = _clock.GetUtcNow().UtcDateTime.Date;

        return new SeasonDto
        {
            Divisions = await model.Divisions.SelectAsync(division => _divisionAdapter.Adapt(division, token)).ToList(),
            Id = model.Id,
            EndDate = model.EndDate,
            StartDate = model.StartDate,
            Name = model.Name,
            IsCurrent = now >= model.StartDate.Date && now <= model.EndDate.Date,
        }.AddAuditProperties(model);
    }

    public async Task<Cosmos.Season.Season> Adapt(SeasonDto dto, CancellationToken token)
    {
        return new Cosmos.Season.Season
        {
            Divisions = await dto.Divisions.SelectAsync(division => _divisionAdapter.Adapt(division, token)).ToList(),
            Id = dto.Id,
            EndDate = dto.EndDate,
            StartDate = dto.StartDate,
            Name = dto.Name.Trim(),
        }.AddAuditProperties(dto);
    }
}