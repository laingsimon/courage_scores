using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddOrUpdateNoteCommand : AddOrUpdateCommand<FixtureDateNote, EditFixtureDateNoteDto>
{
    private readonly ScopedCacheManagementFlags _cacheFlags;

    public AddOrUpdateNoteCommand(ScopedCacheManagementFlags cacheFlags)
    {
        _cacheFlags = cacheFlags;
    }

    protected override Task<ActionResult<FixtureDateNote>> ApplyUpdates(FixtureDateNote model, EditFixtureDateNoteDto update, CancellationToken token)
    {
        var divisionIdToEvictFromCache = GetDivisionIdToEvictFromCache(model, update);

        model.Date = update.Date;
        model.Note = update.Note.TrimOrDefault();
        model.SeasonId = update.SeasonId;
        model.DivisionId = update.DivisionId;
        _cacheFlags.EvictDivisionDataCacheForSeasonId = update.SeasonId;
        _cacheFlags.EvictDivisionDataCacheForDivisionId = divisionIdToEvictFromCache;
        return Task.FromResult(new ActionResult<FixtureDateNote>
        {
            Success = true,
            Messages =
            {
                "Note updated",
            },
        });
    }

    private static Guid GetDivisionIdToEvictFromCache(FixtureDateNote model, EditFixtureDateNoteDto update)
    {
        if (model.DivisionId == update.DivisionId)
        {
            return model.DivisionId ?? ScopedCacheManagementFlags.EvictAll;
        }

        return ScopedCacheManagementFlags.EvictAll;
    }
}