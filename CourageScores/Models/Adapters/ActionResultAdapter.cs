using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public class ActionResultAdapter : IActionResultAdapter
{
    public Task<ActionResultDto<T>> Adapt<T>(IActionResult<T> actionResult)
    {
        return Task.FromResult(new ActionResultDto<T>
        {
            Success = actionResult.Success,
            Result = actionResult.Result,

            Errors = actionResult.Errors,
            Warnings = actionResult.Warnings,
            Messages = actionResult.Messages,
        });
    }

    public Task<ActionResultDto<TResult>> Adapt<T, TResult>(IActionResult<T> actionResult, TResult? result)
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

    public Task<ActionResultDto<T>> Error<T>(string error)
    {
        return Task.FromResult(new ActionResultDto<T>
        {
            Success = false,
            Errors = { error },
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