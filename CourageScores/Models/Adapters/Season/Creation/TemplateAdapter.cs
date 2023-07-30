using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Season.Creation;

public class TemplateAdapter : IAdapter<Template, TemplateDto>
{
    private readonly ISimpleAdapter<SharedAddress, SharedAddressDto> _sharedAddressAdapter;
    private readonly ISimpleAdapter<DivisionTemplate, DivisionTemplateDto> _divisionTemplateAdapter;

    public TemplateAdapter(
        ISimpleAdapter<SharedAddress,SharedAddressDto> sharedAddressAdapter,
        ISimpleAdapter<DivisionTemplate,DivisionTemplateDto> divisionTemplateAdapter)
    {
        _sharedAddressAdapter = sharedAddressAdapter;
        _divisionTemplateAdapter = divisionTemplateAdapter;
    }

    public async Task<TemplateDto> Adapt(Template model, CancellationToken token)
    {
        return new TemplateDto
        {
            Id = model.Id,
            Name = model.Name,
            Divisions = await model.Divisions.SelectAsync(d => _divisionTemplateAdapter.Adapt(d, token)).ToList(),
            SharedAddresses = await model.SharedAddresses.SelectAsync(a => _sharedAddressAdapter.Adapt(a, token)).ToList(),
            TemplateHealth = model.TemplateHealth,
        }.AddAuditProperties(model);
    }

    public async Task<Template> Adapt(TemplateDto dto, CancellationToken token)
    {
        return new Template
        {
            Id = dto.Id,
            Name = dto.Name.Trim(),
            TemplateHealth = dto.TemplateHealth,
            Divisions = await dto.Divisions.SelectAsync(d => _divisionTemplateAdapter.Adapt(d, token)).ToList(),
            SharedAddresses = await dto.SharedAddresses.SelectAsync(a => _sharedAddressAdapter.Adapt(a, token)).ToList(),
        }.AddAuditProperties(dto);
    }
}