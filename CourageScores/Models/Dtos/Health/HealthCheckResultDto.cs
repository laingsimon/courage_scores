using System.Diagnostics.CodeAnalysis;
using CourageScores.Services.Health;

namespace CourageScores.Models.Dtos.Health;

[ExcludeFromCodeCoverage]
public class HealthCheckResultDto
{
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public List<string> Messages { get; set; } = new();
    public bool Success { get; set; }
    public Dictionary<string, SeasonHealthCheckResult> Checks { get; set; } = new();
}