using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public class ActionResultAdapter : IActionResultAdapter
{
    public Task<ActionResultDto<TResult>> Adapt<T, TResult>(IActionResult<T> actionResult, TResult? result = default)
    {
        return Task.FromResult(new ActionResultDto<TResult>
        {
            Success = actionResult.Success,
            Result = result,

            Errors = actionResult.Errors,
            Warnings = actionResult.Warnings,
            Messages = actionResult.Messages,
        });
    }

    public Task<ActionResultDto<T>> Warning<T>(string warning)
    {
        return Task.FromResult(new ActionResultDto<T>
        {
            Success = false,
            Warnings = { warning },
        });
    }
}