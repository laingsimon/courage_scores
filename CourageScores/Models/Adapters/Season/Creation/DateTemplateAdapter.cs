using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Season.Creation;

public class DateTemplateAdapter : ISimpleAdapter<DateTemplate, DateTemplateDto>
{
    private readonly ISimpleAdapter<FixtureTemplate, FixtureTemplateDto> _fixtureTemplateAdapter;

    public DateTemplateAdapter(ISimpleAdapter<FixtureTemplate,FixtureTemplateDto> fixtureTemplateAdapter)
    {
        _fixtureTemplateAdapter = fixtureTemplateAdapter;
    }

    public async Task<DateTemplateDto> Adapt(DateTemplate model, CancellationToken token)
    {
        return new DateTemplateDto
        {
            Fixtures = await model.Fixtures.SelectAsync(f => _fixtureTemplateAdapter.Adapt(f, token)).ToList(),
        };
    }

    public async Task<DateTemplate> Adapt(DateTemplateDto dto, CancellationToken token)
    {
        return new DateTemplate
        {
            Fixtures = await dto.Fixtures.SelectAsync(f => _fixtureTemplateAdapter.Adapt(f, token)).ToList(),
        };
    }
}