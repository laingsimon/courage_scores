namespace CourageScores.Services;

public class CommandOutcome<T>
{
    public bool Success { get; }
    public string Message { get; }
    public T? Result { get; }

    public CommandOutcome(bool success, string message, T? result)
    {
        Success = success;
        Message = message;
        Result = result;
    }
}