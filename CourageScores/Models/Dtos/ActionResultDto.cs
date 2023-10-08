using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos;

/// <summary>
/// The outcome of an action
/// </summary>
/// <typeparam name="TDto"></typeparam>
[ExcludeFromCodeCoverage]
public class ActionResultDto<TDto>
{
    /// <summary>
    /// The outcome of the action
    /// </summary>
    public TDto? Result { get; set; }

    /// <summary>
    /// Whether the action was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Any debug messages from the action
    /// </summary>
    public List<string> Trace { get; set; } = new();

    /// <summary>
    /// Any messages from the action
    /// </summary>
    public List<string> Messages { get; set; } = new();

    /// <summary>
    /// Any errors from the action
    /// </summary>
    public List<string> Errors { get; set; } = new();

    /// <summary>
    /// Any warnings from the action
    /// </summary>
    public List<string> Warnings { get; set; } = new();

    public ActionResultDto<TDto> Merge(IActionResult<TDto> from)
    {
        return new ActionResultDto<TDto>
        {
            Success = Success && from.Success,
            Messages = Messages.Concat(from.Messages).ToList(),
            Warnings = Warnings.Concat(from.Warnings).ToList(),
            Errors = Errors.Concat(from.Errors).ToList(),

            Result = from.Result ?? Result,
        };
    }

    public ActionResultDto<TDto> Merge(ActionResultDto<TDto> from)
    {
        return new ActionResultDto<TDto>
        {
            Success = Success && from.Success,
            Messages = Messages.Concat(from.Messages).ToList(),
            Warnings = Warnings.Concat(from.Warnings).ToList(),
            Errors = Errors.Concat(from.Errors).ToList(),

            Result = from.Result ?? Result,
        };
    }

    public ActionResultDto<TOther> As<TOther>(TOther? result = default)
    {
        return new ActionResultDto<TOther>
        {
            Success = Success,
            Messages = Messages,
            Warnings = Warnings,
            Errors = Errors,
            Result = result,
        };
    }

    public ActionResult<TDto> ToActionResult()
    {
        return new ActionResult<TDto>
        {
            Success = Success,
            Messages = Messages,
            Warnings = Warnings,
            Errors = Errors,
            Result = Result,
        };
    }
}