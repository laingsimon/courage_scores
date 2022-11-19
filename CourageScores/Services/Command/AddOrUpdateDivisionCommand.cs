using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddOrUpdateDivisionCommand : AddOrUpdateCommand<Models.Cosmos.Division, EditDivisionDto>
{
    protected override Task<CommandResult> ApplyUpdates(Models.Cosmos.Division division, EditDivisionDto update, CancellationToken token)
    {
        division.Name = update.Name;
        return Task.FromResult(CommandResult.SuccessNoMessage);
    }
}