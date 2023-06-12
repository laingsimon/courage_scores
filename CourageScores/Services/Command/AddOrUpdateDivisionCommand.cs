using CourageScores.Filters;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddOrUpdateDivisionCommand : AddOrUpdateCommand<Models.Cosmos.Division, EditDivisionDto>
{
    private readonly ScopedCacheManagementFlags _cacheFlags;

    public AddOrUpdateDivisionCommand(ScopedCacheManagementFlags cacheFlags)
    {
        _cacheFlags = cacheFlags;
    }

    protected override Task<CommandResult<Models.Cosmos.Division>> ApplyUpdates(Models.Cosmos.Division division, EditDivisionDto update, CancellationToken token)
    {
        division.Name = update.Name;
        _cacheFlags.EvictDivisionDataCacheForDivisionId = division.Id;
        return Task.FromResult(new CommandResult<Models.Cosmos.Division> { Success = true });
    }
}