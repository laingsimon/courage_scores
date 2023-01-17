using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public class FixtureDateNoteAdapter : IAdapter<FixtureDateNote, FixtureDateNoteDto>
{
    public Task<FixtureDateNoteDto> Adapt(FixtureDateNote model, CancellationToken token)
    {
        return Task.FromResult(new FixtureDateNoteDto
        {
            Id = model.Id,
            Date = model.Date,
            SeasonId = model.SeasonId,
            DivisionId = model.DivisionId,
            Note = model.Note,
        }.AddAuditProperties(model));
    }

    public Task<FixtureDateNote> Adapt(FixtureDateNoteDto dto, CancellationToken token)
    {
        return Task.FromResult(new FixtureDateNote
        {
            Id = dto.Id,
            Date = dto.Date,
            SeasonId = dto.SeasonId,
            DivisionId = dto.DivisionId,
            Note = dto.Note.Trim(),
        }.AddAuditProperties(dto));
    }
}