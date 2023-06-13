namespace CourageScores.Models;

public interface IActionResult<out T>
{
    public bool Success { get; }
    public string Message { get; }
    public T? Result { get; }
    public bool Delete { get; }
}