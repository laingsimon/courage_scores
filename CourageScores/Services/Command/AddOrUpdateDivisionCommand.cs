using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddOrUpdateDivisionCommand : AddOrUpdateCommand<Models.Cosmos.Division, EditDivisionDto>
{
    private readonly ScopedCacheManagementFlags _cacheFlags;

    public AddOrUpdateDivisionCommand(ScopedCacheManagementFlags cacheFlags)
    {
        _cacheFlags = cacheFlags;
    }

    protected override Task<ActionResult<Models.Cosmos.Division>> ApplyUpdates(Models.Cosmos.Division division,
        EditDivisionDto update, CancellationToken token)
    {
        division.Name = update.Name;
        _cacheFlags.EvictDivisionDataCacheForDivisionId = division.Id;
        return Task.FromResult(new ActionResult<Models.Cosmos.Division>
        {
            Success = true,
            Messages =
            {
                "Division updated",
            },
        });
    }
}