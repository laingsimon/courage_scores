namespace CourageScores.Models;

public interface IActionResult<out T>
{
    public bool Success { get; }
    public T? Result { get; }
    public bool Delete { get; }

    public List<string> Errors { get; }
    public List<string> Warnings { get; }
    public List<string> Messages { get; }
}