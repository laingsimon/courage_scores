using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddOrUpdateNoteCommand : AddOrUpdateCommand<FixtureDateNote, FixtureDateNoteDto>
{
    protected override Task<CommandResult> ApplyUpdates(FixtureDateNote model, FixtureDateNoteDto update, CancellationToken token)
    {
        model.Date = update.Date;
        model.Note = update.Note.Trim();
        model.SeasonId = update.SeasonId;
        model.DivisionId = update.DivisionId;
        return Task.FromResult(CommandResult.SuccessNoMessage);
    }
}