using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Command;

public class AddErrorCommand : AddOrUpdateCommand<ErrorDetail, ErrorDetailDto>
{
    private readonly IUserService _userService;

    public AddErrorCommand(IUserService userService)
    {
        _userService = userService;
    }

    protected override async Task<CommandResult> ApplyUpdates(ErrorDetail model, ErrorDetailDto update, CancellationToken token)
    {
        var user = await _userService.GetUser(token);

        model.Type = update.Type;
        model.UserAgent = update.UserAgent;
        model.Source = update.Source;
        model.Stack = update.Stack;
        model.Time = update.Time;
        model.UserName = user?.Name;
        model.Message = update.Message;

        return CommandResult.SuccessNoMessage;
    }
}
