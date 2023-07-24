namespace CourageScores.Services.Health;

public class SeasonHealthCheckResult
{
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public List<string> Messages { get; set; } = new();
    public bool Success { get; set; }

    public SeasonHealthCheckResult MergeWith(SeasonHealthCheckResult other)
    {
        return new SeasonHealthCheckResult
        {
            Success = Success && other.Success,
            Errors = Errors.Concat(other.Errors).ToList(),
            Warnings = Warnings.Concat(other.Warnings).ToList(),
            Messages = Messages.Concat(other.Messages).ToList(),
        };
    }
}