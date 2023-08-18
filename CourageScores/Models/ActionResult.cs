using System.Diagnostics.CodeAnalysis;

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
}