using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Models.Adapters;

public class SeasonAdapter : IAdapter<Season, SeasonDto>
{
    private readonly IAdapter<Cosmos.Division, DivisionDto> _divisionAdapter;
    private readonly ISystemClock _clock;

    public SeasonAdapter(IAdapter<Cosmos.Division, DivisionDto> divisionAdapter, ISystemClock clock)
    {
        _divisionAdapter = divisionAdapter;
        _clock = clock;
    }

    public async Task<SeasonDto> Adapt(Season model, CancellationToken token)
    {
        var now = _clock.UtcNow.UtcDateTime;

        return new SeasonDto
        {
            Divisions = await model.Divisions.SelectAsync(division => _divisionAdapter.Adapt(division, token)).ToList(),
            Id = model.Id,
            EndDate = model.EndDate,
            StartDate = model.StartDate,
            Name = model.Name,
            IsCurrent = now >= model.StartDate && now <= model.EndDate,
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