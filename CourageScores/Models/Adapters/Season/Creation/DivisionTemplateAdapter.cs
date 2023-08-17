using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Season.Creation;

public class DivisionTemplateAdapter : ISimpleAdapter<DivisionTemplate, DivisionTemplateDto>
{
    private readonly ISimpleAdapter<DateTemplate, DateTemplateDto> _dateTemplateAdapter;
    private readonly ISimpleAdapter<List<string>, List<TeamPlaceholderDto>> _sharedAddressAdapter;

    public DivisionTemplateAdapter(
        ISimpleAdapter<DateTemplate, DateTemplateDto> dateTemplateAdapter,
        ISimpleAdapter<List<string>, List<TeamPlaceholderDto>> sharedAddressAdapter)
    {
        _dateTemplateAdapter = dateTemplateAdapter;
        _sharedAddressAdapter = sharedAddressAdapter;
    }

    public async Task<DivisionTemplateDto> Adapt(DivisionTemplate model, CancellationToken token)
    {
        return new DivisionTemplateDto
        {
            Dates = await model.Dates.SelectAsync(d => _dateTemplateAdapter.Adapt(d, token)).ToList(),
            SharedAddresses =
                await model.SharedAddresses.SelectAsync(a => _sharedAddressAdapter.Adapt(a, token)).ToList(),
        };
    }

    public async Task<DivisionTemplate> Adapt(DivisionTemplateDto dto, CancellationToken token)
    {
        return new DivisionTemplate
        {
            Dates = await dto.Dates.SelectAsync(d => _dateTemplateAdapter.Adapt(d, token)).ToList(),
            SharedAddresses = await dto.SharedAddresses.SelectAsync(a => _sharedAddressAdapter.Adapt(a, token)).ToList(),
        };
    }
}