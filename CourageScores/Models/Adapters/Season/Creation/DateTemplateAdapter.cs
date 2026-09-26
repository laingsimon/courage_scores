using CourageScores.Common;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Season.Creation;

public class DateTemplateAdapter : ISimpleAdapter<DateTemplate, DateTemplateDto>
{
    private readonly ISimpleAdapter<FixtureTemplate, FixtureTemplateDto> _fixtureTemplateAdapter;
    private readonly ISimpleAdapter<NoteTemplate, NoteTemplateDto> _noteTemplateAdapter;

    public DateTemplateAdapter(
        ISimpleAdapter<FixtureTemplate, FixtureTemplateDto> fixtureTemplateAdapter,
        ISimpleAdapter<NoteTemplate, NoteTemplateDto> noteTemplateAdapter)
    {
        _fixtureTemplateAdapter = fixtureTemplateAdapter;
        _noteTemplateAdapter = noteTemplateAdapter;
    }

    public async Task<DateTemplateDto> Adapt(DateTemplate model, UserAccessContext context, CancellationToken token)
    {
        return new DateTemplateDto
        {
            Fixtures = await model.Fixtures.SelectAsync(f => _fixtureTemplateAdapter.Adapt(f, context, token)).ToList(),
            Notes = await model.Notes.SelectAsync(n => _noteTemplateAdapter.Adapt(n, context, token)).ToList(),
        };
    }

    public async Task<DateTemplate> Adapt(DateTemplateDto dto, UserAccessContext context, CancellationToken token)
    {
        return new DateTemplate
        {
            Fixtures = await dto.Fixtures.SelectAsync(f => _fixtureTemplateAdapter.Adapt(f, context, token)).ToList(),
            Notes = await dto.Notes.SelectAsync(n => _noteTemplateAdapter.Adapt(n, context, token)).ToList(),
        };
    }
}
