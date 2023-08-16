using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Services.Status;

[ExcludeFromCodeCoverage]
public class ApplicationMetrics
{
    public DateTimeOffset Started { get; set; }
    
    public TimeSpan UpTime => DateTimeOffset.UtcNow.Subtract(Started);

    public static ApplicationMetrics Create()
    {
        return new ApplicationMetrics
        {
            Started = DateTimeOffset.UtcNow,
        };
    }
}