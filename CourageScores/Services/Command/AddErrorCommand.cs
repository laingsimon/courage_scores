using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddErrorCommand : AddOrUpdateCommand<ErrorDetail, ErrorDetailDto>
{
    protected override Task<CommandResult> ApplyUpdates(ErrorDetail model, ErrorDetailDto update, CancellationToken token)
    {
        model.Type = update.Type;
        model.UserAgent = update.UserAgent;
        model.Source = update.Source;
        model.Stack = update.Stack;
        model.Time = update.Time;
        model.UserName = update.UserName;
        model.Message = update.Message;

        return Task.FromResult(CommandResult.SuccessNoMessage);
    }
}