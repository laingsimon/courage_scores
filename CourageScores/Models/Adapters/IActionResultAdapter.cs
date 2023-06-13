using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public interface IActionResultAdapter
{
    Task<ActionResultDto<T>> Adapt<T>(IActionResult<T> actionResult);
    Task<ActionResultDto<TResult>> Adapt<T, TResult>(IActionResult<T> actionResult, TResult? result);
    Task<ActionResultDto<T>> Error<T>(string error);
    Task<ActionResultDto<T>> Warning<T>(string warning);
}