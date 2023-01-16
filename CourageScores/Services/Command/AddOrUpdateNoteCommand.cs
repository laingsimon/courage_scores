using CourageScores.Filters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddOrUpdateNoteCommand : AddOrUpdateCommand<FixtureDateNote, FixtureDateNoteDto>
{
    private readonly ScopedCacheManagementFlags _cacheFlags;

    public AddOrUpdateNoteCommand(ScopedCacheManagementFlags cacheFlags)
    {
        _cacheFlags = cacheFlags;
    }

    protected override Task<CommandResult> ApplyUpdates(FixtureDateNote model, FixtureDateNoteDto update, CancellationToken token)
    {
        model.Date = update.Date;
        model.Note = update.Note.Trim();
        model.SeasonId = update.SeasonId;
        model.DivisionId = update.DivisionId;
        _cacheFlags.EvictDivisionDataCacheForSeasonId = update.SeasonId;
        _cacheFlags.EvictDivisionDataCacheForDivisionId = update.DivisionId;
        return Task.FromResult(CommandResult.SuccessNoMessage);
    }
}