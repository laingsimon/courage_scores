using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;

namespace CourageScores.Models;

[ExcludeFromCodeCoverage]
public class ActionResult<T> : IActionResult<T>
{
    public bool Success { get; init; }
    public T? Result { get; init; }
    public bool Delete { get; init; }

    public List<string> Errors { get; init; } = new();
    public List<string> Warnings { get; init; } = new();
    public List<string> Messages { get; init; } = new();

    public ActionResult<T> Merge(IActionResult<T> from)
    {
        return new ActionResult<T>
        {
            Success = Success && from.Success,
            Delete = Delete || from.Delete,
            Messages = Messages.Concat(from.Messages).ToList(),
            Warnings = Warnings.Concat(from.Warnings).ToList(),
            Errors = Errors.Concat(from.Errors).ToList(),

            Result = from.Result ?? Result,
        };
    }

    public ActionResult<T> Merge(ActionResultDto<T> from)
    {
        return new ActionResult<T>
        {
            Success = Success && from.Success,
            Delete = Delete,
            Messages = Messages.Concat(from.Messages).ToList(),
            Warnings = Warnings.Concat(from.Warnings).ToList(),
            Errors = Errors.Concat(from.Errors).ToList(),

            Result = from.Result ?? Result,
        };
    }

    public ActionResult<TOther> As<TOther>(TOther? result = default)
    {
        return new ActionResult<TOther>
        {
            Success = Success,
            Delete = Delete,
            Messages = Messages,
            Warnings = Warnings,
            Errors = Errors,
            Result = result,
        };
    }
}