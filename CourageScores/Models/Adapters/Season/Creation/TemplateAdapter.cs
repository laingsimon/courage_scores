﻿using CourageScores.Common;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Models.Adapters.Season.Creation;

public class TemplateAdapter : IAdapter<Template, TemplateDto>
{
    private readonly ISimpleAdapter<DivisionTemplate, DivisionTemplateDto> _divisionTemplateAdapter;
    private readonly ISimpleAdapter<List<string>, List<TeamPlaceholderDto>> _sharedAddressAdapter;

    public TemplateAdapter(
        ISimpleAdapter<List<string>, List<TeamPlaceholderDto>> sharedAddressAdapter,
        ISimpleAdapter<DivisionTemplate, DivisionTemplateDto> divisionTemplateAdapter)
    {
        _sharedAddressAdapter = sharedAddressAdapter;
        _divisionTemplateAdapter = divisionTemplateAdapter;
    }

    public async Task<TemplateDto> Adapt(Template model, CancellationToken token)
    {
        return new TemplateDto
        {
            Id = model.Id,
            Name = model.Name.TrimOrDefault(),
            Divisions = await model.Divisions.SelectAsync(d => _divisionTemplateAdapter.Adapt(d, token)).ToList(),
            SharedAddresses = await model.SharedAddresses.SelectAsync(a => _sharedAddressAdapter.Adapt(a, token)).ToList(),
            TemplateHealth = model.TemplateHealth,
            Description = model.Description?.Trim(),
        }.AddAuditProperties(model);
    }

    public async Task<Template> Adapt(TemplateDto dto, CancellationToken token)
    {
        return new Template
        {
            Id = dto.Id,
            Name = dto.Name.TrimOrDefault(),
            TemplateHealth = dto.TemplateHealth,
            Divisions = await dto.Divisions.SelectAsync(d => _divisionTemplateAdapter.Adapt(d, token)).ToList(),
            SharedAddresses = await dto.SharedAddresses.SelectAsync(a => _sharedAddressAdapter.Adapt(a, token)).ToList(),
            Description = dto.Description?.Trim(),
        }.AddAuditProperties(dto);
    }
}
