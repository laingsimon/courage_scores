namespace CourageScores.Models.Dtos;

/// <summary>
/// The outcome of an action
/// </summary>
/// <typeparam name="TDto"></typeparam>
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
    /// Any messages from the action
    /// </summary>
    public List<string> Messages { get; set; } = new List<string>();

    /// <summary>
    /// Any errors from the action
    /// </summary>
    public List<string> Errors { get; set; } = new List<string>();

    /// <summary>
    /// Any warnings from the action
    /// </summary>
    public List<string> Warnings { get; set; } = new List<string>();
}
