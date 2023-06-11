namespace CourageScores.Services.Command;

public class CommandOutcome<T> : ICommandOutcome<T>
{
    public bool Success { get; }
    public string Message { get; }
    public T? Result { get; }
    public bool Delete { get; init; }

    public CommandOutcome(bool success, string message, T? result)
    {
        Success = success;
        Message = message;
        Result = result;
    }
}