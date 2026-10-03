using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Season.Creation;

public class NoteTemplateAdapter : ISimpleAdapter<NoteTemplate, NoteTemplateDto>
{
    public Task<NoteTemplateDto> Adapt(NoteTemplate model, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new NoteTemplateDto
        {
            Id = model.Id,
            AlternativeDayOfWeek = model.AlternativeDayOfWeek,
            DivisionNumber = model.DivisionNumber,
            Note = model.Note,
        });
    }

    public Task<NoteTemplate> Adapt(NoteTemplateDto dto, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new NoteTemplate
        {
            Id = dto.Id,
            AlternativeDayOfWeek = dto.AlternativeDayOfWeek,
            DivisionNumber = dto.DivisionNumber,
            Note = dto.Note,
        });
    }
}
