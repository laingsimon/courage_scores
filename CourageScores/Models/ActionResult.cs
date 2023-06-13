using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models;

[ExcludeFromCodeCoverage]
public class ActionResult<T> : IActionResult<T>
{
    public bool Success { get; init; }
    public T? Result { get; init; }
    public bool Delete { get; init; }

    public string? Errors { get; init; }
    public string? Warnings { get; init; }
    public string? Messages { get; init; }
}