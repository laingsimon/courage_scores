namespace CourageScores.Services.Command;

public interface ICommandOutcome<out T>
{
    bool Success { get; }
    string Message { get; }
    bool Delete { get; init; }
    T? Result { get; }
}