namespace TypeScriptMapper;

public interface IStrategy
{
    Task Execute(string outputDirectory, string? onlyType, CancellationToken token);
}