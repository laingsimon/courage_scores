namespace CourageScores.Services.Command;

public class CommandResult<T> : ICommandResult<T>
{
    public bool Success { get; init; }
    public T? Result { get; init; }
    public bool Delete { get; init; }

    public string? Error { get; init; }
    public string? Warning { get; init; }
    public string? Message { get; init; }
}